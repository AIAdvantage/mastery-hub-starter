import { supabase } from "./supabase.js";

const SESSION_KEY = "mastery_analytics_session_id";
const AUTH_PATHS = new Set(["/sign-in", "/sign-up"]);
const ALLOWED_PAYLOAD_FIELDS = ["guide_name", "guide_link", "step_number", "step_title", "metadata"];

function analyticsSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const value = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, value);
    return value;
  } catch {
    return null;
  }
}

export function trackEvent(eventName, payload = {}) {
  if (!supabase || typeof window === "undefined") return;
  const pagePath = window.location.pathname;
  if (eventName === "page_view" && AUTH_PATHS.has(pagePath)) return;

  const event = {
    event_name: eventName,
    page_path: pagePath,
    session_id: analyticsSessionId(),
  };

  ALLOWED_PAYLOAD_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      event[field] = payload[field];
    }
  });

  supabase
    .from("mastery_site_events")
    .insert(event)
    .then(({ error }) => {
      if (error) {
        console.warn("Analytics event failed", error.message);
      }
    });
}

export function trackStepHelpClick(eventName, helpContext, step, stepNumber) {
  trackEvent(eventName, {
    guide_name: helpContext?.guideName || null,
    guide_link: helpContext?.guideLink || null,
    step_number: stepNumber,
    step_title: step?.shortTitle || step?.title || null,
    metadata: {
      full_step_title: step?.title || null,
    },
  });
}
