import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.MASTERY_ADMIN_TOKEN;
const IMAGE_BUCKET = "mastery-guide-images";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

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

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) {
    json(res, 500, { error: "Admin token is not configured" });
    return false;
  }
  const token = String(req.headers["x-admin-token"] || "");
  const tokenBuffer = Buffer.from(token);
  const adminBuffer = Buffer.from(ADMIN_TOKEN);
  const tokenMatches = tokenBuffer.length === adminBuffer.length && timingSafeEqual(tokenBuffer, adminBuffer);
  if (!tokenMatches) {
    json(res, 401, { error: "Admin access required" });
    return false;
  }
  return true;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function cleanMonth(input = {}) {
  return {
    slug: String(input.slug || "").trim().toLowerCase(),
    label: String(input.label || "").trim(),
    month_number: input.month_number || input.label || null,
    topic: input.topic || null,
    focus: input.focus || "",
    outcome: input.outcome || "",
    hero: input.hero || {},
    resources: Array.isArray(input.resources) ? input.resources : [],
    guide_markdown: input.guide_markdown || "",
    challenge_markdown: input.challenge_markdown || "",
    challenge_prompt: input.challenge_prompt || "",
    prompts: Array.isArray(input.prompts) ? input.prompts : [],
    extras: input.extras || {},
    admin_notes: input.admin_notes || "",
    updated_by: input.updated_by || null,
  };
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function pathLabel(value) {
  if (!value || value === "/") return "Home";
  return value
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => part.replace(/-/g, " "))
    .join(" / ");
}

function safeFileName(value = "screenshot.png") {
  const [name, ...extensionParts] = String(value).split(".");
  const extension = extensionParts.pop() || "png";
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "screenshot";
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "png";
  return `${safeName}.${safeExtension}`;
}

function imageExtensionForType(contentType = "") {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }[contentType] || "";
}

async function ensureImageBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if ((buckets || []).some((bucket) => bucket.name === IMAGE_BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });

  if (createError && !/already exists/i.test(createError.message || "")) {
    throw createError;
  }
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function aggregateEvents(events = []) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    return date.toISOString().slice(0, 10);
  });

  const pageViews = events.filter((event) => event.event_name === "page_view");
  const helpClicks = events.filter((event) => event.event_name === "ask_ai_click" || event.event_name === "ask_mods_click");
  const copyClicks = events.filter((event) => event.event_name === "copy_prompt_click");
  const sessions = events.map((event) => event.session_id);

  const trend = days.map((date) => {
    const dayEvents = events.filter((event) => dayKey(event.created_at) === date);
    const dayPageViews = dayEvents.filter((event) => event.event_name === "page_view");
    return {
      date,
      page_views: dayPageViews.length,
      unique_sessions: uniqueCount(dayEvents.map((event) => event.session_id)),
      help_clicks: dayEvents.filter((event) => event.event_name === "ask_ai_click" || event.event_name === "ask_mods_click").length,
      copy_clicks: dayEvents.filter((event) => event.event_name === "copy_prompt_click").length,
    };
  });

  const eventBreakdown = Object.values(events.reduce((acc, event) => {
    const key = event.event_name || "unknown";
    acc[key] ||= { event_name: key, count: 0, unique_sessions: new Set() };
    acc[key].count += 1;
    if (event.session_id) acc[key].unique_sessions.add(event.session_id);
    return acc;
  }, {})).map((row) => ({
    event_name: row.event_name,
    count: row.count,
    unique_sessions: row.unique_sessions.size,
  })).sort((a, b) => b.count - a.count);

  const topPages = Object.values(pageViews.reduce((acc, event) => {
    const key = event.page_path || "/";
    acc[key] ||= { page_path: key, label: pathLabel(key), views: 0, unique_sessions: new Set() };
    acc[key].views += 1;
    if (event.session_id) acc[key].unique_sessions.add(event.session_id);
    return acc;
  }, {})).map((row) => ({
    page_path: row.page_path,
    label: row.label,
    views: row.views,
    unique_sessions: row.unique_sessions.size,
  })).sort((a, b) => b.views - a.views).slice(0, 12);

  const helpByStep = Object.values(helpClicks.reduce((acc, event) => {
    const key = `${event.guide_name || "Unknown"}|${event.step_number || ""}|${event.step_title || "Unknown step"}`;
    acc[key] ||= {
      guide_name: event.guide_name || "Unknown",
      step_number: event.step_number || null,
      step_title: event.step_title || "Unknown step",
      ask_ai_clicks: 0,
      ask_mods_clicks: 0,
      unique_sessions: new Set(),
    };
    if (event.event_name === "ask_ai_click") acc[key].ask_ai_clicks += 1;
    if (event.event_name === "ask_mods_click") acc[key].ask_mods_clicks += 1;
    if (event.session_id) acc[key].unique_sessions.add(event.session_id);
    return acc;
  }, {})).map((row) => ({
    guide_name: row.guide_name,
    step_number: row.step_number,
    step_title: row.step_title,
    ask_ai_clicks: row.ask_ai_clicks,
    ask_mods_clicks: row.ask_mods_clicks,
    total_clicks: row.ask_ai_clicks + row.ask_mods_clicks,
    unique_sessions: row.unique_sessions.size,
  })).sort((a, b) => b.total_clicks - a.total_clicks).slice(0, 12);

  return {
    summary: {
      total_events: events.length,
      page_views: pageViews.length,
      unique_sessions: uniqueCount(sessions),
      help_clicks: helpClicks.length,
      copy_clicks: copyClicks.length,
      top_page: topPages[0]?.label || "No page views yet",
    },
    trend,
    event_breakdown: eventBreakdown,
    top_pages: topPages,
    help_by_step: helpByStep,
    latest_events: events.slice(0, 20),
  };
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = service();

    if (req.method === "GET") {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const action = url.searchParams.get("action") || "list";

      if (action === "analytics") {
        const since = new Date();
        since.setDate(since.getDate() - 90);

        const { data: events, error: eventsError } = await supabase
          .from("mastery_site_events")
          .select("created_at, event_name, page_path, page_url, session_id, guide_name, guide_link, step_number, step_title, metadata")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(10000);
        if (eventsError) throw eventsError;

        const { data: helpRows, error } = await supabase
          .from("mastery_site_help_click_counts")
          .select("*")
          .order("event_date", { ascending: false })
          .order("event_name", { ascending: true })
          .order("step_number", { ascending: true });
        if (error) throw error;
        return json(res, 200, { rows: helpRows || [], report: aggregateEvents(events || []) });
      }

      if (action === "month") {
        const slug = url.searchParams.get("slug");
        const { data, error } = await supabase
          .from("mastery_month_drafts")
          .select("*")
          .eq("slug", slug)
          .single();
        if (error && error.code !== "PGRST116") throw error;
        return json(res, 200, { month: data || null });
      }

      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .select("id, slug, label, month_number, topic, focus, outcome, status, is_published, published_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return json(res, 200, { months: data || [] });
    }

    if (req.method !== "POST") {
      return json(res, 405, { error: "Method not allowed" });
    }

    const body = await readBody(req);
    const action = body.action || "save";

    if (action === "upload-image") {
      const contentType = String(body.content_type || "").toLowerCase();
      const extension = imageExtensionForType(contentType);
      if (!extension) {
        return json(res, 400, { error: "Upload a PNG, JPG, WebP, or GIF image." });
      }

      const base64 = String(body.data || "").replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
      if (!base64) {
        return json(res, 400, { error: "Image data is required." });
      }

      const buffer = Buffer.from(base64, "base64");
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
        return json(res, 400, { error: "Image must be under 6 MB." });
      }

      await ensureImageBucket(supabase);

      const slug = String(body.month_slug || "shared").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "shared";
      const fileName = safeFileName(body.file_name || `screenshot.${extension}`).replace(/\.[a-z0-9]+$/, `.${extension}`);
      const path = `${slug}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
      return json(res, 200, { url: data.publicUrl, path });
    }

    if (action === "save") {
      const month = cleanMonth(body.month);
      if (!month.slug || !month.label) {
        return json(res, 400, { error: "Month slug and label are required" });
      }
      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .upsert(month, { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw error;
      return json(res, 200, { month: data });
    }

    if (action === "publish") {
      const slug = String(body.slug || "").trim().toLowerCase();
      const isPublished = Boolean(body.is_published);
      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .update({
          is_published: isPublished,
          status: isPublished ? "published" : "draft",
          published_at: isPublished ? new Date().toISOString() : null,
          updated_by: body.updated_by || null,
        })
        .eq("slug", slug)
        .select("*")
        .single();
      if (error) throw error;
      return json(res, 200, { month: data });
    }

    if (action === "delete") {
      const slug = String(body.slug || "").trim().toLowerCase();
      const { error } = await supabase
        .from("mastery_month_drafts")
        .delete()
        .eq("slug", slug)
        .eq("is_published", false);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: "Unknown admin action" });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Admin request failed" });
  }
}
