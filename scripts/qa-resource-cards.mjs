import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  || process.env.SUPABASE_URL
  || "https://egsopqlfovtutbelezha.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const checkUrls = process.argv.includes("--check-urls");
const VALID_REFS = new Set(["guide", "challenge", "prompts", "extras", "page", "link", "system"]);

if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function visibleCardSnapshot(resource = {}) {
  return {
    category: resource.category,
    type: resource.type,
    title: resource.title,
    description: resource.description,
    status: resource.status,
    is_published: resource.is_published,
    url: resource.url,
  };
}

function monthContentSnapshot(month = {}) {
  return {
    label: month.label,
    month_number: month.month_number,
    topic: month.topic,
    focus: month.focus,
    outcome: month.outcome,
    hero: month.hero,
    guide_markdown: month.guide_markdown,
    guide_toc: month.guide_toc,
    challenge_markdown: month.challenge_markdown,
    challenge_prompt: month.challenge_prompt,
    prompts: month.prompts,
    extras: month.extras,
    admin_notes: month.admin_notes,
    status: month.status,
    is_published: month.is_published,
    published_at: month.published_at,
  };
}

async function checkUrl(resource) {
  const target = /^https?:\/\//i.test(resource.url)
    ? resource.url
    : `https://mastery.aiadvantage.com${resource.url}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 Mastery-QA" },
    });
    return { ok: response.status >= 200 && response.status < 400, status: response.status };
  } catch (error) {
    return { ok: false, status: 0, error: error.name };
  } finally {
    clearTimeout(timeout);
  }
}

const { data: months, error } = await supabase
  .from("mastery_month_drafts")
  .select("*")
  .order("slug");
if (error) throw error;

const errors = [];
const warnings = [];
const pageIds = new Map();
const publishedCards = [];
let cardCount = 0;

for (const month of months || []) {
  const resources = Array.isArray(month.resources) ? month.resources : [];
  const urlMap = new Map();

  for (const resource of resources) {
    cardCount += 1;
    const label = `${month.slug}: ${resource.title || "Untitled card"}`;
    if (!VALID_REFS.has(resource.content_ref)) errors.push(`${label} has no valid content_ref`);
    if (resource.content_ref === "page") {
      if (!resource.id) errors.push(`${label} has no page id`);
      if (!resource.content_markdown?.trim()) errors.push(`${label} has no independent page content`);
      if (!resource.url?.startsWith(`/monthly-resources/${month.slug}/`)) errors.push(`${label} has an invalid page URL`);
      if (pageIds.has(resource.id)) errors.push(`${label} duplicates page id used by ${pageIds.get(resource.id)}`);
      pageIds.set(resource.id, label);
    }
    if (resource.content_ref === "system" && !resource.system_page) errors.push(`${label} has no system page id`);
    if (resource.content_ref === "link" && resource.content_kind === "page") errors.push(`${label} is both link and page`);
    if ((resource.is_published === true || resource.status === "published") && !resource.url) {
      errors.push(`${label} is published without a URL`);
    }
    if (resource.url) {
      urlMap.set(resource.url, [...(urlMap.get(resource.url) || []), resource]);
      if (resource.is_published === true || resource.status === "published") publishedCards.push({ month, resource });
    }
  }

  for (const [url, matches] of urlMap) {
    if (matches.length < 2) continue;
    const refs = new Set(matches.map((resource) => resource.content_ref));
    if (refs.size !== 1 || !["guide", "challenge", "prompts", "extras"].includes(matches[0].content_ref)) {
      errors.push(`${month.slug}: ambiguous duplicate URL ${url}`);
    } else {
      warnings.push(`${month.slug}: intentional shared ${matches[0].content_ref} aliases (${matches.map((resource) => resource.title).join(" + ")})`);
    }
  }

  const { data: backups, error: backupError } = await supabase
    .from("mastery_month_draft_versions")
    .select("snapshot")
    .eq("month_slug", month.slug)
    .eq("source", "repair-backup")
    .order("created_at", { ascending: false })
    .limit(1);
  if (backupError) throw backupError;
  const backup = backups?.[0]?.snapshot;
  if (backup) {
    if (JSON.stringify((backup.resources || []).map(visibleCardSnapshot)) !== JSON.stringify(resources.map(visibleCardSnapshot))) {
      errors.push(`${month.slug}: visible card data changed from repair backup`);
    }
    if (JSON.stringify(monthContentSnapshot(backup)) !== JSON.stringify(monthContentSnapshot(month))) {
      errors.push(`${month.slug}: month content changed from repair backup`);
    }
  }
}

const urlResults = [];
if (checkUrls) {
  for (let index = 0; index < publishedCards.length; index += 8) {
    const batch = publishedCards.slice(index, index + 8);
    const results = await Promise.all(batch.map(async ({ month, resource }) => ({
      month: month.slug,
      title: resource.title,
      url: resource.url,
      ...(await checkUrl(resource)),
    })));
    urlResults.push(...results);
  }
  for (const result of urlResults) {
    if (!result.ok) errors.push(`${result.month}: ${result.title} returned ${result.status || result.error}`);
  }
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  months: months?.length || 0,
  cards: cardCount,
  standalonePages: pageIds.size,
  publishedUrlsChecked: urlResults.length,
  publishedUrlsPassed: urlResults.filter((result) => result.ok).length,
  warnings,
  errors,
}, null, 2));

if (errors.length) process.exitCode = 1;
