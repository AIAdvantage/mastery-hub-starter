import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  || process.env.SUPABASE_URL
  || "https://egsopqlfovtutbelezha.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const CONTENT_FIELDS = [
  "label",
  "month_number",
  "topic",
  "focus",
  "outcome",
  "hero",
  "guide_markdown",
  "guide_toc",
  "challenge_markdown",
  "challenge_prompt",
  "prompts",
  "extras",
  "admin_notes",
  "status",
  "is_published",
  "published_at",
];

const { data: months, error } = await supabase
  .from("mastery_month_drafts")
  .select("*")
  .order("slug");
if (error) throw error;

const report = [];
for (const month of months || []) {
  const { data: versions, error: versionError } = await supabase
    .from("mastery_month_draft_versions")
    .select("snapshot")
    .eq("month_slug", month.slug)
    .eq("source", "repair-backup")
    .order("created_at", { ascending: false })
    .limit(1);
  if (versionError) throw versionError;
  const backup = versions?.[0]?.snapshot;
  if (!backup) throw new Error(`No repair backup found for ${month.slug}`);

  const currentResources = Array.isArray(month.resources) ? month.resources : [];
  const backupResources = Array.isArray(backup.resources) ? backup.resources : [];
  if (currentResources.length !== backupResources.length) {
    throw new Error(`Card count changed for ${month.slug}`);
  }

  const resources = backupResources.map((resource, index) => {
    const current = currentResources[index] || {};
    const restored = { ...resource, content_ref: current.content_ref };
    if (current.content_ref === "page") {
      restored.id = current.id;
      restored.content_kind = "page";
      restored.content_markdown = current.content_markdown;
      restored.content_toc = current.content_toc;
    }
    if (current.content_ref === "system") restored.system_page = current.system_page;
    return restored;
  });

  const update = { resources, updated_by: "Alfredo - exact repair backup restore" };
  for (const field of CONTENT_FIELDS) update[field] = backup[field];

  const { error: updateError } = await supabase
    .from("mastery_month_drafts")
    .update(update)
    .eq("slug", month.slug);
  if (updateError) throw updateError;
  report.push({ slug: month.slug, cards: resources.length, restored: true });
}

console.log(JSON.stringify({ months: report.length, report }, null, 2));
