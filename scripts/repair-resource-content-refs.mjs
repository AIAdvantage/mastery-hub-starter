import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  || process.env.SUPABASE_URL
  || "https://egsopqlfovtutbelezha.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apply = process.argv.includes("--apply");

if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SYSTEM_PAGES = new Map([
  ["/monthly-resources/july/prerequisites", "july-prerequisites"],
  ["/monthly-resources/july/faq-catchup", "july-faq-catchup"],
  ["/monthly-resources/july/challenge-submissions", "july-challenge-submissions"],
]);

function resourceContentRef(resource, month) {
  if (resource.content_kind === "page" || resource.content_ref === "page") return "page";
  const url = String(resource.url || "");
  if (!url || /^https?:\/\//i.test(url)) return "link";
  if (SYSTEM_PAGES.has(url)) return "system";
  if (url === `/monthly-resources/${month.slug}/guide`) return "guide";
  if (url === `/monthly-resources/${month.slug}/prompts`) return "prompts";
  if (url === `/monthly-resources/${month.slug}/extras`) return "extras";
  if (url === `/challenges/${month.slug}` || url === `/challenges/${month.slug}/guide`) return "challenge";
  if (url.startsWith(`/monthly-resources/${month.slug}/guide/`)) return "page";
  return "system";
}

function migrateResource(resource, month, index) {
  const contentRef = resourceContentRef(resource, month);
  const migrated = { ...resource, content_ref: contentRef };

  if (contentRef === "page") {
    migrated.id = resource.id || `${month.slug}-page-${index + 1}`;
    migrated.content_kind = "page";
    migrated.content_markdown = resource.content_markdown || month.guide_markdown || "";
    migrated.content_toc = resource.content_toc || month.guide_toc || {};
  }

  if (contentRef === "system") {
    migrated.system_page = resource.system_page || SYSTEM_PAGES.get(resource.url) || "custom-system-page";
  }

  return migrated;
}

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

const { data: months, error } = await supabase
  .from("mastery_month_drafts")
  .select("*")
  .order("slug");
if (error) throw error;

const report = [];
for (const month of months || []) {
  const beforeResources = Array.isArray(month.resources) ? month.resources : [];
  const afterResources = beforeResources.map((resource, index) => migrateResource(resource, month, index));
  const visibleBefore = JSON.stringify(beforeResources.map(visibleCardSnapshot));
  const visibleAfter = JSON.stringify(afterResources.map(visibleCardSnapshot));
  if (visibleBefore !== visibleAfter) throw new Error(`Visible card data changed for ${month.slug}`);

  const changed = JSON.stringify(beforeResources) !== JSON.stringify(afterResources);
  const refs = afterResources.reduce((counts, resource) => ({
    ...counts,
    [resource.content_ref]: (counts[resource.content_ref] || 0) + 1,
  }), {});
  report.push({ slug: month.slug, cards: afterResources.length, changed, refs });

  if (!apply || !changed) continue;

  const { error: backupError } = await supabase
    .from("mastery_month_draft_versions")
    .insert({
      month_slug: month.slug,
      snapshot: month,
      source: "repair-backup",
      saved_by: "Alfredo",
    });
  if (backupError) throw backupError;

  const { error: updateError } = await supabase
    .from("mastery_month_drafts")
    .update({
      resources: afterResources,
      updated_by: "Alfredo - card content reference repair",
    })
    .eq("slug", month.slug);
  if (updateError) throw updateError;
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", months: report }, null, 2));
