import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.MASTERY_ADMIN_TOKEN;
const IMAGE_BUCKET = "mastery-guide-images";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const REQUEST_FILE_BUCKET = "mastery-request-files";
const MAX_REQUEST_FILE_BYTES = 2 * 1024 * 1024;
const REQUEST_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);
const VERSION_HISTORY_LIMIT = 20;
const CONTENT_STATUSES = new Set([
  "idea",
  "outline",
  "first draft",
  "testing",
  "final draft",
  "ready to publish",
  "published",
]);
const RESOURCE_CATEGORIES = new Set(["Workshop", "Challenge", "Other", "Next month"]);

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

function normalizeAdminToken(value = "") {
  const trimmed = String(value).trim();
  const hexToken = trimmed.match(/[a-f0-9]{32,}/i);
  if (hexToken) return hexToken[0];
  return trimmed.replace(/[^\x21-\x7e]/g, "");
}

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) {
    json(res, 500, { error: "Admin token is not configured" });
    return false;
  }
  const token = normalizeAdminToken(req.headers["x-admin-token"]);
  const expectedToken = normalizeAdminToken(ADMIN_TOKEN);
  const tokenBuffer = Buffer.from(token);
  const adminBuffer = Buffer.from(expectedToken);
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
    resources: Array.isArray(input.resources) ? input.resources.map(cleanResource) : [],
    guide_markdown: input.guide_markdown || "",
    challenge_markdown: input.challenge_markdown || "",
    challenge_prompt: input.challenge_prompt || "",
    prompts: Array.isArray(input.prompts) ? input.prompts : [],
    extras: input.extras || {},
    admin_notes: input.admin_notes || "",
    updated_by: input.updated_by || null,
  };
}

function cleanResource(input = {}) {
  const legacyStatus = input.status === "tested" ? "testing" : input.status === "final" ? "final draft" : input.status;
  const isPublished = Boolean(input.is_published) || legacyStatus === "published";
  return {
    category: cleanResourceCategory(input.category),
    type: input.type || "Resource",
    title: input.title || "",
    description: input.description || "",
    status: isPublished ? "published" : (CONTENT_STATUSES.has(legacyStatus) ? legacyStatus : "idea"),
    is_published: isPublished,
    url: input.url || "",
  };
}

function cleanResourceCategory(category) {
  if (category === "Extras" || category === "Follow up resources") return "Other";
  if (category === "Coming next" || category === "Coming Next") return "Next month";
  return RESOURCE_CATEGORIES.has(category) ? category : "Other";
}

function monthSnapshot(input = {}) {
  return {
    slug: input.slug,
    label: input.label,
    month_number: input.month_number,
    topic: input.topic,
    focus: input.focus,
    outcome: input.outcome,
    hero: input.hero || {},
    resources: Array.isArray(input.resources) ? input.resources : [],
    guide_markdown: input.guide_markdown || "",
    challenge_markdown: input.challenge_markdown || "",
    challenge_prompt: input.challenge_prompt || "",
    prompts: Array.isArray(input.prompts) ? input.prompts : [],
    extras: input.extras || {},
    admin_notes: input.admin_notes || "",
    status: input.status || null,
    is_published: Boolean(input.is_published),
    published_at: input.published_at || null,
    updated_at: input.updated_at || null,
    updated_by: input.updated_by || null,
  };
}

function monthEditableSnapshot(input = {}) {
  const snapshot = monthSnapshot(input);
  delete snapshot.status;
  delete snapshot.is_published;
  delete snapshot.published_at;
  delete snapshot.updated_at;
  delete snapshot.updated_by;
  return snapshot;
}

function stableJson(value) {
  return JSON.stringify(value);
}

async function archiveMonthVersion(supabase, existingMonth, { source = "save", savedBy = null } = {}) {
  if (!existingMonth?.slug) return;
  const snapshot = monthSnapshot(existingMonth);

  const { data: latest, error: latestError } = await supabase
    .from("mastery_month_draft_versions")
    .select("id, snapshot")
    .eq("month_slug", existingMonth.slug)
    .neq("source", "auto")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;

  if (latest?.snapshot && stableJson(latest.snapshot) === stableJson(snapshot)) return;

  const { error: insertError } = await supabase
    .from("mastery_month_draft_versions")
    .insert({
      month_slug: existingMonth.slug,
      snapshot,
      source,
      saved_by: savedBy,
    });
  if (insertError) throw insertError;

  const { data: oldVersions, error: oldVersionsError } = await supabase
    .from("mastery_month_draft_versions")
    .select("id")
    .eq("month_slug", existingMonth.slug)
    .order("created_at", { ascending: false })
    .range(VERSION_HISTORY_LIMIT, 1000);
  if (oldVersionsError) throw oldVersionsError;

  const oldIds = (oldVersions || []).map((version) => version.id);
  if (oldIds.length) {
    const { error: deleteError } = await supabase
      .from("mastery_month_draft_versions")
      .delete()
      .in("id", oldIds);
    if (deleteError) throw deleteError;
  }
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

function cleanActor(input = {}) {
  return {
    id: String(input.id || "").trim().slice(0, 200),
    name: String(input.name || input.email || "Admin").trim().slice(0, 200),
    email: String(input.email || "").trim().toLowerCase().slice(0, 320) || null,
    avatar: String(input.avatar || "").trim().slice(0, 2000) || null,
  };
}

function cleanCommentBody(value) {
  return String(value || "").trim().slice(0, 5000);
}

const REQUEST_STATUSES = new Set(["new", "planned", "in-progress", "done"]);
const REQUEST_PRIORITIES = new Set(["low", "medium", "high"]);
const REQUEST_AREAS = new Set(["Platform", "Month Content", "Guide", "Workshop", "Challenge", "Resources", "Member Experience", "Backend", "Other"]);

function cleanRequestText(value, max = 5000) {
  return String(value || "").trim().slice(0, max);
}

function cleanRequestAttachments(value) {
  if (!Array.isArray(value) || value.length > 10) return null;
  return value.map((attachment) => ({
    name: cleanRequestText(attachment?.name, 240),
    url: cleanRequestText(attachment?.url, 2000),
    path: cleanRequestText(attachment?.path, 500),
    type: cleanRequestText(attachment?.type, 160),
    size: Number(attachment?.size) || 0,
  })).filter((attachment) => attachment.name && (attachment.path || attachment.url));
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

async function ensureRequestFileBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if ((buckets || []).some((bucket) => bucket.name === REQUEST_FILE_BUCKET)) {
    const { error: updateError } = await supabase.storage.updateBucket(REQUEST_FILE_BUCKET, {
      public: false,
      fileSizeLimit: MAX_REQUEST_FILE_BYTES,
      allowedMimeTypes: [...REQUEST_FILE_TYPES],
    });
    if (updateError && !/not found/i.test(updateError.message || "")) throw updateError;
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(REQUEST_FILE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_REQUEST_FILE_BYTES,
    allowedMimeTypes: [...REQUEST_FILE_TYPES],
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

      if (action === "history") {
        const slug = url.searchParams.get("slug");
        const { data, error } = await supabase
          .from("mastery_month_draft_versions")
          .select("id, month_slug, snapshot, source, saved_by, created_at")
          .eq("month_slug", slug)
          .neq("source", "auto")
          .order("created_at", { ascending: false })
          .limit(VERSION_HISTORY_LIMIT);
        if (error) throw error;
        return json(res, 200, { versions: data || [] });
      }

      if (action === "comments") {
        const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();
        const documentKey = String(url.searchParams.get("document_key") || "guide").trim().slice(0, 80);
        const { data, error } = await supabase
          .from("mastery_editor_comments")
          .select("*")
          .eq("month_slug", slug)
          .eq("document_key", documentKey)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json(res, 200, { comments: data || [] });
      }

      if (action === "requests") {
        const { data: requests, error: requestError } = await supabase
          .from("mastery_admin_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (requestError) throw requestError;

        const requestIds = (requests || []).map((item) => item.id);
        let comments = [];
        if (requestIds.length) {
          const { data, error } = await supabase
            .from("mastery_admin_request_comments")
            .select("*")
            .in("request_id", requestIds)
            .order("created_at", { ascending: true });
          if (error) throw error;
          comments = data || [];
        }

        const commentsByRequest = comments.reduce((grouped, comment) => {
          if (!grouped[comment.request_id]) grouped[comment.request_id] = [];
          grouped[comment.request_id].push(comment);
          return grouped;
        }, {});

        return json(res, 200, {
          requests: (requests || []).map((item) => ({
            ...item,
            comments: commentsByRequest[item.id] || [],
          })),
        });
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

    if (action === "create-request") {
      const actor = cleanActor(body.actor);
      const title = cleanRequestText(body.title, 240);
      const description = cleanRequestText(body.description);
      const priority = REQUEST_PRIORITIES.has(body.priority) ? body.priority : "medium";
      const area = REQUEST_AREAS.has(body.area) ? body.area : "Platform";
      const attachments = body.attachments === undefined ? [] : cleanRequestAttachments(body.attachments);
      if (!actor.id || !title || !description) {
        return json(res, 400, { error: "Author, title, and details are required." });
      }
      if (attachments === null) return json(res, 400, { error: "A request can have up to 10 attachments." });

      const { data, error } = await supabase.from("mastery_admin_requests").insert({
        title,
        description,
        area,
        priority,
        status: "new",
        attachments,
        submitted_by: actor.id,
        submitted_by_name: actor.name,
        submitted_by_email: actor.email,
        submitted_by_avatar: actor.avatar,
      }).select("*").single();
      if (error) throw error;
      return json(res, 200, { request: data });
    }

    if (action === "update-request") {
      const actor = cleanActor(body.actor);
      const requestId = String(body.request_id || "").trim();
      if (!actor.id || !requestId) return json(res, 400, { error: "Author and request are required." });
      const patch = body.patch || {};
      const update = { updated_at: new Date().toISOString() };

      if (patch.status !== undefined) {
        if (!REQUEST_STATUSES.has(patch.status)) return json(res, 400, { error: "Unknown request status." });
        update.status = patch.status;
        update.completed_at = patch.status === "done" ? new Date().toISOString() : null;
      }
      if (patch.priority !== undefined) {
        if (!REQUEST_PRIORITIES.has(patch.priority)) return json(res, 400, { error: "Unknown request priority." });
        update.priority = patch.priority;
      }
      if (patch.area !== undefined) {
        if (!REQUEST_AREAS.has(patch.area)) return json(res, 400, { error: "Unknown request area." });
        update.area = patch.area;
      }
      if (patch.team_notes !== undefined) update.team_notes = cleanRequestText(patch.team_notes);
      if (patch.title !== undefined) update.title = cleanRequestText(patch.title, 240);
      if (patch.description !== undefined) update.description = cleanRequestText(patch.description);
      if (patch.title !== undefined && !update.title) return json(res, 400, { error: "Request title cannot be blank." });
      if (patch.description !== undefined && !update.description) return json(res, 400, { error: "Request details cannot be blank." });
      if (patch.attachments !== undefined) {
        const attachments = cleanRequestAttachments(patch.attachments);
        if (attachments === null) {
          return json(res, 400, { error: "A request can have up to 10 attachments." });
        }
        update.attachments = attachments;
      }

      const { data, error } = await supabase
        .from("mastery_admin_requests")
        .update(update)
        .eq("id", requestId)
        .select("*")
        .single();
      if (error) throw error;
      return json(res, 200, { request: data });
    }

    if (action === "delete-request") {
      const actor = cleanActor(body.actor);
      const requestId = String(body.request_id || "").trim();
      if (!actor.id || !requestId) return json(res, 400, { error: "Author and request are required." });
      const { data: existing, error: existingError } = await supabase
        .from("mastery_admin_requests")
        .select("attachments")
        .eq("id", requestId)
        .single();
      if (existingError) throw existingError;
      const paths = (existing.attachments || []).map((file) => file?.path).filter(Boolean);
      if (paths.length) {
        const { error: removeError } = await supabase.storage.from(REQUEST_FILE_BUCKET).remove(paths);
        if (removeError) throw removeError;
      }
      const { error } = await supabase.from("mastery_admin_requests").delete().eq("id", requestId);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    if (action === "create-request-comment") {
      const actor = cleanActor(body.actor);
      const requestId = String(body.request_id || "").trim();
      const commentBody = cleanCommentBody(body.body);
      if (!actor.id || !requestId || !commentBody) {
        return json(res, 400, { error: "Author, request, and reply are required." });
      }
      const { data, error } = await supabase.from("mastery_admin_request_comments").insert({
        request_id: requestId,
        body: commentBody,
        author_id: actor.id,
        author_name: actor.name,
        author_email: actor.email,
        author_avatar: actor.avatar,
      }).select("*").single();
      if (error) throw error;
      return json(res, 200, { comment: data });
    }

    if (action === "delete-request-comment") {
      const actor = cleanActor(body.actor);
      const commentId = String(body.comment_id || "").trim();
      if (!actor.id || !commentId) return json(res, 400, { error: "Author and reply are required." });
      const { data: existing, error: existingError } = await supabase
        .from("mastery_admin_request_comments")
        .select("author_id")
        .eq("id", commentId)
        .single();
      if (existingError) throw existingError;
      if (existing.author_id !== actor.id) return json(res, 403, { error: "Only the reply creator can delete it." });
      const { error } = await supabase.from("mastery_admin_request_comments").delete().eq("id", commentId);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    if (action === "create-comment") {
      const actor = cleanActor(body.actor);
      const commentBody = cleanCommentBody(body.body);
      const monthSlug = String(body.month_slug || "").trim().toLowerCase();
      const documentKey = String(body.document_key || "guide").trim().slice(0, 80);
      if (!actor.id || !commentBody || !monthSlug) return json(res, 400, { error: "Author, month, and comment are required." });

      const parentId = body.parent_id ? String(body.parent_id).trim() : null;
      let selectionStart = Math.max(0, Number(body.selection_start) || 0);
      let selectionEnd = Math.max(selectionStart, Number(body.selection_end) || selectionStart);
      let quotedText = String(body.quoted_text || "").slice(0, 4000);
      if (parentId) {
        const { data: parent, error: parentError } = await supabase
          .from("mastery_editor_comments")
          .select("month_slug, document_key, selection_start, selection_end, quoted_text, parent_id")
          .eq("id", parentId)
          .single();
        if (parentError) throw parentError;
        if (parent.parent_id || parent.month_slug !== monthSlug || parent.document_key !== documentKey) {
          return json(res, 400, { error: "Reply thread does not match this document." });
        }
        selectionStart = parent.selection_start;
        selectionEnd = parent.selection_end;
        quotedText = parent.quoted_text;
      } else if (selectionEnd <= selectionStart || !quotedText.trim()) {
        return json(res, 400, { error: "Select text before leaving a comment." });
      }

      const { data, error } = await supabase.from("mastery_editor_comments").insert({
        month_slug: monthSlug,
        document_key: documentKey,
        selection_start: selectionStart,
        selection_end: selectionEnd,
        quoted_text: quotedText,
        body: commentBody,
        author_id: actor.id,
        author_name: actor.name,
        author_email: actor.email,
        author_avatar: actor.avatar,
        parent_id: parentId,
      }).select("*").single();
      if (error) throw error;
      return json(res, 200, { comment: data });
    }

    if (action === "update-comment" || action === "delete-comment") {
      const actor = cleanActor(body.actor);
      const commentId = String(body.comment_id || "").trim();
      if (!actor.id || !commentId) return json(res, 400, { error: "Author and comment are required." });
      const { data: existing, error: existingError } = await supabase
        .from("mastery_editor_comments").select("*").eq("id", commentId).single();
      if (existingError) throw existingError;
      if (existing.author_id !== actor.id) return json(res, 403, { error: "Only the comment creator can change it." });

      if (action === "delete-comment") {
        const { error } = await supabase.from("mastery_editor_comments").delete().eq("id", commentId);
        if (error) throw error;
        return json(res, 200, { ok: true });
      }

      const commentBody = cleanCommentBody(body.body);
      if (!commentBody) return json(res, 400, { error: "Comment cannot be empty." });
      const { data, error } = await supabase.from("mastery_editor_comments")
        .update({ body: commentBody, updated_at: new Date().toISOString() })
        .eq("id", commentId).select("*").single();
      if (error) throw error;
      return json(res, 200, { comment: data });
    }

    if (action === "resolve-comment") {
      const actor = cleanActor(body.actor);
      const commentId = String(body.comment_id || "").trim();
      if (!actor.id || !commentId) return json(res, 400, { error: "Author and comment are required." });
      const resolved = Boolean(body.resolved);
      const { data, error } = await supabase.from("mastery_editor_comments")
        .update({ resolved_at: resolved ? new Date().toISOString() : null, resolved_by: resolved ? actor.name : null, updated_at: new Date().toISOString() })
        .eq("id", commentId).is("parent_id", null).select("*").single();
      if (error) throw error;
      return json(res, 200, { comment: data });
    }

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
        return json(res, 400, { error: "Image must be under 3 MB." });
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

    if (action === "upload-request-file") {
      const contentType = String(body.content_type || "").toLowerCase();
      if (!REQUEST_FILE_TYPES.has(contentType)) {
        return json(res, 400, { error: "Upload an image, PDF, text, Word, Excel, or ZIP file." });
      }

      const base64 = String(body.data || "").replace(/^data:[^;]+;base64,/i, "");
      if (!base64) return json(res, 400, { error: "File data is required." });

      const buffer = Buffer.from(base64, "base64");
      if (!buffer.length || buffer.length > MAX_REQUEST_FILE_BYTES) {
        return json(res, 400, { error: "Files must be under 2 MB each." });
      }

      await ensureRequestFileBucket(supabase);
      const requestKey = String(body.request_key || "new")
        .trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 80) || "new";
      const fileName = safeFileName(body.file_name || "attachment");
      const path = `${requestKey}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(REQUEST_FILE_BUCKET)
        .upload(path, buffer, { contentType, upsert: false });
      if (uploadError) throw uploadError;

      const { data: signed, error: signedError } = await supabase.storage
        .from(REQUEST_FILE_BUCKET)
        .createSignedUrl(path, 60 * 15);
      if (signedError) throw signedError;

      return json(res, 200, {
        attachment: {
          name: cleanRequestText(body.file_name, 240) || fileName,
          url: signed.signedUrl,
          path,
          type: contentType,
          size: buffer.length,
        },
      });
    }

    if (action === "request-file-url") {
      const path = cleanRequestText(body.path, 500);
      if (!path || path.includes("..")) return json(res, 400, { error: "File path is required." });
      const { data, error } = await supabase.storage
        .from(REQUEST_FILE_BUCKET)
        .createSignedUrl(path, 60 * 15);
      if (error) throw error;
      return json(res, 200, { url: data.signedUrl });
    }

    if (action === "delete-request-file") {
      const path = cleanRequestText(body.path, 500);
      if (!path || path.includes("..")) return json(res, 400, { error: "File path is required." });
      const { error } = await supabase.storage.from(REQUEST_FILE_BUCKET).remove([path]);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    if (action === "save") {
      const month = cleanMonth(body.month);
      if (!month.slug || !month.label) {
        return json(res, 400, { error: "Month slug and label are required" });
      }

      const { data: existing, error: existingError } = await supabase
        .from("mastery_month_drafts")
        .select("*")
        .eq("slug", month.slug)
        .maybeSingle();
      if (existingError) throw existingError;
      const source = body.source || "manual";

      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .upsert(month, { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw error;
      // Autosave continuously protects the working draft, but only an explicit
      // save creates a durable team checkpoint in Version History.
      if (source !== "auto") {
        await archiveMonthVersion(supabase, data, {
          source: source === "manual" ? "checkpoint" : source,
          savedBy: month.updated_by || body.updated_by || null,
        });
      }
      return json(res, 200, { month: data });
    }

    if (action === "restore-version") {
      const versionId = String(body.version_id || "").trim();
      const { data: version, error: versionError } = await supabase
        .from("mastery_month_draft_versions")
        .select("*")
        .eq("id", versionId)
        .single();
      if (versionError) throw versionError;

      const { data: existing, error: existingError } = await supabase
        .from("mastery_month_drafts")
        .select("*")
        .eq("slug", version.month_slug)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        await archiveMonthVersion(supabase, existing, {
          source: "restore",
          savedBy: body.updated_by || null,
        });
      }

      const restoredMonth = cleanMonth({
        ...(version.snapshot || {}),
        slug: version.month_slug,
        updated_by: body.updated_by || null,
      });
      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .upsert(restoredMonth, { onConflict: "slug" })
        .select("*")
        .single();
      if (error) throw error;
      return json(res, 200, { month: data });
    }

    if (action === "set-live-month") {
      const slug = String(body.slug || "").trim().toLowerCase();
      if (!slug) return json(res, 400, { error: "Live month slug is required." });

      const { data: monthExists, error: monthExistsError } = await supabase
        .from("mastery_month_drafts")
        .select("slug")
        .eq("slug", slug)
        .maybeSingle();
      if (monthExistsError) throw monthExistsError;
      if (!monthExists) return json(res, 404, { error: "Save this month before making it live." });

      const { error: demoteError } = await supabase
        .from("mastery_month_drafts")
        .update({
          status: "published",
          updated_by: body.updated_by || null,
        })
        .eq("is_published", true)
        .neq("slug", slug);
      if (demoteError) throw demoteError;

      const { data, error } = await supabase
        .from("mastery_month_drafts")
        .update({
          is_published: true,
          status: "published",
          published_at: new Date().toISOString(),
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
