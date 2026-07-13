import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_MONTH_COLUMNS = "slug, label, month_number, topic, focus, outcome, hero, resources, guide_markdown, challenge_markdown, challenge_prompt, prompts, extras, published_at, updated_at";

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
      return json(res, 200, { month: data || null });
    }

    const { data, error } = await supabase
      .from("mastery_month_drafts")
      .select(PUBLIC_MONTH_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return json(res, 200, { months: data || [] });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Content request failed" });
  }
}
