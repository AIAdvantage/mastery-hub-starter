import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_MONTH_COLUMNS = "slug, label, month_number, topic, focus, outcome, hero, resources, guide_markdown, guide_toc, challenge_markdown, challenge_prompt, prompts, extras, status, published_at, updated_at";
const CONTENT_KEYS = {
  guide: ["guide_markdown", "guide_toc"],
  prompts: ["prompts"],
  extras: ["extras"],
  challenge: ["challenge_markdown", "challenge_prompt"],
};

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function service() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase service credentials are not configured");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function resourceContentKey(resource = {}) {
  if (resource.content_kind === "page" || resource.content_ref === "page") return "resource";
  if (["guide", "challenge", "prompts", "extras"].includes(resource.content_ref)) return resource.content_ref;
  if (["link", "system"].includes(resource.content_ref)) return "resource";
  const haystack = `${resource.category || ""} ${resource.type || ""} ${resource.title || ""} ${resource.url || ""}`.toLowerCase();
  if (haystack.includes("challenge") || haystack.includes("/challenges/")) return "challenge";
  if (haystack.includes("extra") || haystack.includes("/extras")) return "extras";
  if (haystack.includes("prompt") || haystack.includes("/prompts")) return "prompts";
  if (haystack.includes("guide") || haystack.includes("/guide")) return "guide";
  return "resource";
}

function isPublishedResource(resource = {}) {
  return resource.is_published === true || resource.status === "published";
}

function sanitizePublishedMonth(month) {
  if (!month) return null;
  const publishedResources = Array.isArray(month.resources)
    ? month.resources.filter((resource) => resource?.title && isPublishedResource(resource))
    : [];
  const publishedKeys = new Set(publishedResources.map(resourceContentKey));
  const sanitized = {
    ...month,
    guide_toc: {},
    resources: publishedResources.map((resource) => ({ ...resource, content_toc: {} })),
  };

  Object.entries(CONTENT_KEYS).forEach(([key, fields]) => {
    if (publishedKeys.has(key)) return;
    // Workshop guides can embed copy-prompt controls, so their prompt payload
    // must remain available even when the archive uses one combined Resources card.
    if (key === "prompts" && publishedKeys.has("guide")) return;
    fields.forEach((field) => {
      sanitized[field] = field === "prompts" ? [] : (field === "extras" || field === "guide_toc") ? {} : "";
    });
  });

  return sanitized;
}

function liveMonthFrom(months = []) {
  return months[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  try {
    const supabase = service();
    const url = new URL(req.url, `https://${req.headers.host}`);
    const slug = url.searchParams.get("slug");

    if (slug) {
      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .select(PUBLIC_MONTH_COLUMNS)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return json(res, 200, { month: sanitizePublishedMonth(data) });
    }

    const { data, error } = await supabase
      .from("mastery_month_drafts")
      .select(PUBLIC_MONTH_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    const months = (data || []).map(sanitizePublishedMonth);
    const liveMonth = liveMonthFrom(months);
    const liveMonthSlug = liveMonth?.slug || null;
    const routedMonths = months.map((month) => ({
      ...month,
      is_current: month.slug === liveMonthSlug,
    }));
    return json(res, 200, { months: routedMonths, liveMonthSlug });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Content request failed" });
  }
}
