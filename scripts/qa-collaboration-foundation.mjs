import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const apiSource = await readFile(new URL("../api/mastery-admin.js", import.meta.url), "utf8");
const editorSource = await readFile(new URL("../src/admin/AdminBackend.jsx", import.meta.url), "utf8");
const publicApiSource = await readFile(new URL("../api/mastery-content.js", import.meta.url), "utf8");

for (const required of [
  'action === "revision"',
  'action === "editor-lease"',
  'action === "create-suggestion"',
  'action === "decide-suggestion"',
  'expected_revision',
  '.eq("revision", expectedRevision)',
  'return json(res, 409',
]) assert.ok(apiSource.includes(required), `API collaboration guard missing: ${required}`);

for (const required of [
  "RECOVERY_STORAGE_PREFIX",
  "saveBlockedRef",
  "expected_revision",
  "mastery_admin_recovery_",
  "editor-lease",
  "setInterval(checkRevision, 1500)",
  "captureRenderedSelection",
  "review-selection-popover",
  "startRenderedComment(renderedSelection.mapped, true)",
  "suppressComposer={renderedSelection?.mode === \"comment\"}",
  "onMouseUp={(event) => event.stopPropagation()}",
]) assert.ok(editorSource.includes(required), `Editor collaboration guard missing: ${required}`);

for (const forbidden of ["mastery_editor_comments", "mastery_editor_suggestions", "mastery_editor_leases"]) {
  assert.ok(!publicApiSource.includes(forbidden), `Public content API must not expose ${forbidden}`);
}
for (const forbiddenColumn of ["revision", "updated_by", "admin_notes"]) {
  const publicColumns = publicApiSource.match(/PUBLIC_MONTH_COLUMNS = "([^"]+)"/)?.[1] || "";
  assert.ok(!publicColumns.split(",").map((item) => item.trim()).includes(forbiddenColumn), `Public content columns must not include ${forbiddenColumn}`);
}

if (process.env.MASTERY_COLLAB_INTEGRATION !== "1") {
  console.log("Collaboration foundation source QA passed.");
  process.exit(0);
}

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MASTERY_ADMIN_TOKEN"];
for (const key of requiredEnv) assert.ok(process.env[key], `${key} is required for integration QA`);

const adminToken = process.env.MASTERY_ADMIN_TOKEN;
const baseUrl = String(process.env.MASTERY_COLLAB_BASE_URL || "").replace(/\/$/, "");
const handler = baseUrl ? null : (await import(`../api/mastery-admin.js?qa=${Date.now()}`)).default;
const slug = `s1-collab-qa-${Date.now()}`;
const actorA = { id: "qa-browser-a", name: "QA Browser A", email: "qa-a@example.com" };
const actorB = { id: "qa-browser-b", name: "QA Browser B", email: "qa-b@example.com" };
const customPrefix = "[[part-break:Part 1]]\n";
const customSuffix = "\n[[copy-prompt:1]]";

async function request(body) {
  if (baseUrl) {
    const response = await fetch(`${baseUrl}/api/mastery-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  const raw = JSON.stringify(body);
  const req = {
    method: "POST",
    url: "/api/mastery-admin",
    headers: { host: "localhost", "x-admin-token": adminToken },
    async *[Symbol.asyncIterator]() { yield Buffer.from(raw); },
  };
  let statusCode = 200;
  let responseBody = "";
  const res = {
    status(value) { statusCode = value; return this; },
    setHeader() {},
    end(value = "") { responseBody = String(value); },
  };
  await handler(req, res);
  return { status: statusCode, data: responseBody ? JSON.parse(responseBody) : {} };
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

try {
  const month = { slug, label: "S1 Collaboration QA", guide_markdown: "Initial" };
  const created = await request({ action: "save", source: "auto", expected_revision: 0, month });
  assert.equal(created.status, 200);
  assert.equal(created.data.month.revision, 1);

  const savedA = await request({
    action: "save", source: "manual", expected_revision: 1,
    month: { ...created.data.month, guide_markdown: `${customPrefix}Browser A saved${customSuffix}` },
  });
  assert.equal(savedA.status, 200);
  assert.equal(savedA.data.month.revision, 2);

  const staleB = await request({
    action: "save", source: "auto", expected_revision: 1,
    month: { ...created.data.month, guide_markdown: "Browser B stale overwrite" },
  });
  assert.equal(staleB.status, 409);
  assert.equal(staleB.data.month.revision, 2);
  assert.equal(staleB.data.month.guide_markdown, `${customPrefix}Browser A saved${customSuffix}`);

  const leaseA = await request({
    action: "editor-lease", operation: "acquire", actor: actorA,
    month_slug: slug, document_key: "guide", holder_session: "browser-a",
  });
  assert.equal(leaseA.status, 200);
  assert.equal(leaseA.data.lease.granted, true);

  const leaseBBlocked = await request({
    action: "editor-lease", operation: "acquire", actor: actorB,
    month_slug: slug, document_key: "guide", holder_session: "browser-b",
  });
  assert.equal(leaseBBlocked.status, 200);
  assert.equal(leaseBBlocked.data.lease.granted, false);
  assert.equal(leaseBBlocked.data.lease.holder_name, actorA.name);

  await request({
    action: "editor-lease", operation: "release", actor: actorA,
    month_slug: slug, document_key: "guide", holder_session: "browser-a",
  });
  const leaseBAfterRelease = await request({
    action: "editor-lease", operation: "acquire", actor: actorB,
    month_slug: slug, document_key: "guide", holder_session: "browser-b",
  });
  assert.equal(leaseBAfterRelease.data.lease.granted, true);

  const makeSuggestion = async ({ type, content, quoted, replacement, revision }) => {
    const start = content.indexOf(quoted);
    assert.ok(start >= 0, `QA quote not found: ${quoted}`);
    const createdSuggestion = await request({
      action: "create-suggestion", actor: actorB, month_slug: slug, document_key: "guide",
      suggestion_type: type, selection_start: start, selection_end: start + quoted.length,
      quoted_text: quoted, replacement_text: replacement, source_revision: revision,
    });
    assert.equal(createdSuggestion.status, 200);
    return createdSuggestion.data.suggestion;
  };

  let currentContent = `${customPrefix}Browser A saved${customSuffix}`;
  let suggestion = await makeSuggestion({ type: "replacement", content: currentContent, quoted: "A", replacement: "Alpha", revision: 2 });
  let decision = await request({ action: "decide-suggestion", actor: actorA, suggestion_id: suggestion.id, decision: "accepted" });
  assert.equal(decision.status, 200);
  assert.equal(decision.data.month.revision, 3);
  currentContent = `${customPrefix}Browser Alpha saved${customSuffix}`;
  assert.equal(decision.data.month.guide_markdown, currentContent);

  suggestion = await makeSuggestion({ type: "insertion", content: currentContent, quoted: "Alpha", replacement: " team", revision: 3 });
  decision = await request({ action: "decide-suggestion", actor: actorA, suggestion_id: suggestion.id, decision: "accepted" });
  assert.equal(decision.status, 200);
  assert.equal(decision.data.month.revision, 4);
  currentContent = `${customPrefix}Browser Alpha team saved${customSuffix}`;
  assert.equal(decision.data.month.guide_markdown, currentContent);

  suggestion = await makeSuggestion({ type: "deletion", content: currentContent, quoted: "team ", replacement: "", revision: 4 });
  decision = await request({ action: "decide-suggestion", actor: actorA, suggestion_id: suggestion.id, decision: "accepted" });
  assert.equal(decision.status, 200);
  assert.equal(decision.data.month.revision, 5);
  currentContent = `${customPrefix}Browser Alpha saved${customSuffix}`;
  assert.equal(decision.data.month.guide_markdown, currentContent);

  suggestion = await makeSuggestion({ type: "replacement", content: currentContent, quoted: "Alpha", replacement: "Stale", revision: 5 });
  const intervening = await request({
    action: "save", source: "auto", expected_revision: 5,
    month: { ...decision.data.month, guide_markdown: `${currentContent}\nElsewhere` },
  });
  assert.equal(intervening.status, 200);
  const staleDecision = await request({ action: "decide-suggestion", actor: actorA, suggestion_id: suggestion.id, decision: "accepted" });
  assert.equal(staleDecision.status, 409);
  const { data: staleRow, error: staleError } = await supabase.from("mastery_editor_suggestions").select("status").eq("id", suggestion.id).single();
  if (staleError) throw staleError;
  assert.equal(staleRow.status, "stale");

  const { count, error } = await supabase
    .from("mastery_month_draft_versions")
    .select("id", { count: "exact", head: true })
    .eq("month_slug", slug);
  if (error) throw error;
  assert.equal(count, 4, "Manual save plus three accepted suggestions should create four checkpoints");

  console.log("Collaboration foundation integration QA passed.");
} finally {
  await supabase.from("mastery_editor_leases").delete().eq("month_slug", slug);
  await supabase.from("mastery_editor_suggestions").delete().eq("month_slug", slug);
  await supabase.from("mastery_month_draft_versions").delete().eq("month_slug", slug);
  await supabase.from("mastery_month_drafts").delete().eq("slug", slug);
}
