import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const apiSource = await readFile(new URL("../api/mastery-admin.js", import.meta.url), "utf8");
const editorSource = await readFile(new URL("../src/admin/AdminBackend.jsx", import.meta.url), "utf8");

for (const required of [
  'action === "revision"',
  'action === "editor-lease"',
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
]) assert.ok(editorSource.includes(required), `Editor collaboration guard missing: ${required}`);

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
    month: { ...created.data.month, guide_markdown: "Browser A saved" },
  });
  assert.equal(savedA.status, 200);
  assert.equal(savedA.data.month.revision, 2);

  const staleB = await request({
    action: "save", source: "auto", expected_revision: 1,
    month: { ...created.data.month, guide_markdown: "Browser B stale overwrite" },
  });
  assert.equal(staleB.status, 409);
  assert.equal(staleB.data.month.revision, 2);
  assert.equal(staleB.data.month.guide_markdown, "Browser A saved");

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

  const { count, error } = await supabase
    .from("mastery_month_draft_versions")
    .select("id", { count: "exact", head: true })
    .eq("month_slug", slug);
  if (error) throw error;
  assert.equal(count, 1, "Manual save should create exactly one checkpoint");

  console.log("Collaboration foundation integration QA passed.");
} finally {
  await supabase.from("mastery_editor_leases").delete().eq("month_slug", slug);
  await supabase.from("mastery_month_draft_versions").delete().eq("month_slug", slug);
  await supabase.from("mastery_month_drafts").delete().eq("slug", slug);
}
