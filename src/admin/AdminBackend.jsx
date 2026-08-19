import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { JULY_CONTENT } from "../julyContent.js";
import MasteryRequests from "./MasteryRequests.jsx";

const TOKEN_KEY = "mastery_admin_token";
const FULL_PREVIEW_STORAGE_PREFIX = "mastery_full_preview_";
const RECOVERY_STORAGE_PREFIX = "mastery_admin_recovery_";
const EDITOR_SESSION_KEY = "mastery_editor_session";
const WORKSHOP_YEAR = "2026";
const MASTERY_ORIGIN = "https://mastery.aiadvantage.com";

const UPCOMING_MONTH_PRESETS = [
  {
    slug: "january",
    label: "January",
    topic: "Personal",
    focus: "Build Your Personal AI Advisory Board",
    outcome: "Turn your DNA and decision history into a council of advisor personas inside a custom GPT.",
  },
  {
    slug: "february",
    label: "February",
    topic: "Strategy",
    focus: "Build Custom Business Tools",
    outcome: "Use your clone DNA and strategy prompts to build a hosted dashboard with charts and a chatbot.",
  },
  {
    slug: "march",
    label: "March",
    topic: "Time",
    focus: "Turn Your Expertise Into AI Workflows",
    outcome: "Teach AI your personal decision-making process.",
  },
  {
    slug: "april",
    label: "April",
    topic: "Marketing",
    focus: "Create Content, Visuals, and Marketing Assets With AI",
    outcome: "Build a Claude marketing employee that can research, draft, and review content.",
  },
  {
    slug: "may",
    label: "May",
    topic: "Sales",
    focus: "Automate Your Sales Follow-Ups",
    outcome: "Turn meeting transcripts into proposals, follow-up drafts, and a reusable workflow.",
  },
  {
    slug: "june",
    label: "June",
    topic: "Operations",
    focus: "Build an AI Paperwork Assistant",
    outcome: "Build a paperwork system that fills forms from a reusable profile and then improves itself.",
  },
  {
    slug: "july",
    label: "July",
    topic: "AI Hub",
    focus: "Build Your AI Hub",
    outcome: "Build your own private AI Hub website where everything your AI creates shows up.",
  },
  {
    slug: "august",
    label: "August",
    topic: "To be announced",
    focus: "August Mastery Workshop",
    outcome: "Prepare August's guide, live materials, extras, and challenge before this month goes live.",
  },
  {
    slug: "september",
    label: "September",
    topic: "To be announced",
    focus: "September Mastery Workshop",
    outcome: "Prepare September's guide, live materials, extras, and challenge before this month goes live.",
  },
  {
    slug: "october",
    label: "October",
    topic: "To be announced",
    focus: "October Mastery Workshop",
    outcome: "Prepare October's guide, live materials, extras, and challenge before this month goes live.",
  },
  {
    slug: "november",
    label: "November",
    topic: "To be announced",
    focus: "November Mastery Workshop",
    outcome: "Prepare November's guide, live materials, extras, and challenge before this month goes live.",
  },
  {
    slug: "december",
    label: "December",
    topic: "To be announced",
    focus: "December Mastery Workshop",
    outcome: "Prepare December's guide, live materials, extras, and challenge before this month goes live.",
  },
];

const MONTH_TEMPLATE_HERO_SRC = "/july/july-ai-hub-card-relatable-3.png";

const PRESET_ORDER = UPCOMING_MONTH_PRESETS.reduce((acc, preset, index) => {
  acc[preset.slug] = index;
  return acc;
}, {});

const CONTENT_TABS = ["content", "month-setup"];
const RESOURCE_EDITOR_TABS = ["guide", "challenge", "prompts", "extras"];
const ADMIN_SECTIONS = ["content", "analytics", "requests"];
const RESOURCE_CATEGORIES = ["Workshop", "Challenge", "Other", "Next month"];
const RESOURCE_STATUSES = ["idea", "outline", "first draft", "testing", "final draft", "ready to publish", "published"];
function extractMarkdownLink(text = "") {
  const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!linkMatch) return { text };
  return {
    text: text.replace(linkMatch[0], "").replace(/\s{2,}/g, " ").trim(),
    linkLabel: linkMatch[1].replace(/\*\*/g, ""),
    link: linkMatch[2],
  };
}

function cleanPrepText(text = "") {
  return text
    .replace(/^[-*]\s+/, "")
    .replace(/^💡\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitPrepChecklistText(text = "") {
  const linked = extractMarkdownLink(cleanPrepText(text));
  const value = linked.text;
  const colonMatch = value.match(/^(.{3,80}?):\s+(.+)$/);
  const dashMatch = value.match(/^(.{3,80}?)\s+[—–-]\s+(.+)$/);
  const [, title, detail] = colonMatch || dashMatch || [];
  return {
    title: title || value,
    detail: detail || "",
    link: linked.link,
    linkLabel: linked.linkLabel,
  };
}

function isPrepExperienceBlock(block) {
  const text = cleanPrepText(block?.text || "");
  return /^previous experience required\b/i.test(text)
    || /^lightbulb:/i.test(text)
    || String(block?.text || "").trim().startsWith("💡");
}

function prepExperienceText(text = "") {
  return cleanPrepText(text)
    .replace(/^(previous experience required|tip|note|lightbulb):\s*/i, "")
    .trim();
}

function prepChecklistFromBlocks(blocks = []) {
  const items = [];
  const notes = [];
  const experience = [];
  let current = null;

  blocks.forEach((block) => {
    if (block.type === "check") {
      const item = splitPrepChecklistText(block.text);
      current = {
        ...item,
        detailParts: item.detail ? [item.detail] : [],
      };
      items.push(current);
      return;
    }

    if (isPrepExperienceBlock(block)) {
      experience.push(prepExperienceText(block.text));
      current = null;
      return;
    }

    if (isNoteBlock(block.text)) {
      notes.push(noteText(block.text));
      current = null;
      return;
    }

    if (current && ["paragraph", "bullet", "quote"].includes(block.type)) {
      const linked = extractMarkdownLink(cleanPrepText(block.text));
      if (linked.text) current.detailParts.push(linked.text);
      if (linked.link && !current.link) {
        current.link = linked.link;
        current.linkLabel = linked.linkLabel;
      }
    }
  });

  return {
    items: items.map((item) => {
      const detail = item.detailParts.join(" ").replace(/\s+/g, " ").trim();
      return {
        label: item.title,
        detail,
        ...(item.link ? { link: item.link, linkLabel: item.linkLabel } : {}),
      };
    }),
    notes: notes.filter(Boolean),
    experience: experience.filter(Boolean).join(" "),
  };
}

const MARKDOWN_TOOL_GROUPS = [
  {
    title: "Guide cards",
    items: [
      { label: "Page Title", template: "# Page Title\n\n", syntax: "# Page Title", preview: "Large document title." },
      { label: "Generic Card", template: "## New Card\n\nWrite the card content here.\n\n", syntax: "## New Card", preview: "A standard customer card." },
      { label: "Part Break", template: "## PART 1: New Section\n\n", syntax: "## PART 1: Title", preview: "Starts a table-of-contents group. It does not render as a card." },
      { label: "Prep Card", template: "## Before You Start\n\n- [ ] **Primary account ready:** Make sure you can sign in before you start the guide. [Open service](https://example.com)\n- [ ] **Starter files ready:** Download or prepare the files you will use during the workshop.\n- [ ] **Workspace ready:** Open the tool or folder where you will build today.\n\n**Previous experience required:** No previous experience required. You only need the accounts, files, and workspace listed above.\n\n", syntax: "## Before You Start", preview: "Prep checklist card with setup links." },
      { label: "Outcome Card", template: "## What You'll Have When Done\n\n- [ ] Clear outcome one\n- [ ] Clear outcome two\n\n", syntax: "## What You'll Have When Done", preview: "Outcome checklist card." },
      { label: "Step Card", template: "## Step 1: New Step\n\nWrite one clear sentence explaining the outcome.\n\n1. First instruction.\n2. Second instruction.\n\n", syntax: "## Step 1: Title", preview: "Numbered guide card." },
      { label: "Bonus Card", template: "## 🏆 Bonus: New Bonus\n\n1. First bonus instruction.\n\n", syntax: "## 🏆 Bonus: Title", preview: "Closing bonus card." },
      { label: "Finish Card", template: "## Next Steps\n\n- What to do next.\n\n", syntax: "## Next Steps", preview: "Finish card." },
    ],
  },
  {
    title: "Inside a card",
    items: [
      { label: "Subheading", template: "### New Subheading\n\n", syntax: "### New Subheading", preview: "Small heading inside the current card." },
      { label: "Bullet", template: "- New bullet\n", syntax: "- Bullet", preview: "Bullet row." },
      { label: "Check", template: "- [ ] New checklist item\n", syntax: "- [ ] Checklist item", preview: "Checklist row." },
      { label: "Numbered Step", template: "1. First instruction.\n", syntax: "1. Instruction", preview: "Numbered instruction row." },
      { label: "Quote", template: "> Add a quote or key teaching line here.\n\n", syntax: "> Teaching line", preview: "Quote block." },
      { label: "Divider", template: "\n---\n\n", syntax: "---", preview: "Horizontal divider." },
    ],
  },
  {
    title: "Custom preview blocks",
    items: [
      { label: "Learning Moment", template: "💡 Learning moment: Explain the concept in simple, beginner-friendly terms.\n\n", syntax: "💡 Learning moment: Text", preview: "Learning Moment callout." },
      { label: "Your Win", template: "🏆 **Your Win:** Name the milestone they just reached.\n\n", syntax: "🏆 **Your Win:** Text", preview: "Your Win callout." },
      { label: "Note", template: "**Note:** Add Igor's note here.\n\n", syntax: "**Note:** Text", preview: "Note from Igor callout." },
      { label: "Igor's Note", template: "📝 **Igor's Note:** Add Igor's personal note here.\n\n", syntax: "📝 **Igor's Note:** Text", preview: "Igor note callout with Igor's image." },
      { label: "Heads Up", template: "🛟 **Heads up:** Add the important warning here.\n\n", syntax: "🛟 **Heads up:** Text", preview: "Heads up warning callout." },
      { label: "Experience Note", template: "**Previous experience required:** No previous experience required.\n\n", syntax: "**Previous experience required:** Text", preview: "Prep-card experience note." },
      { label: "Image Figure", template: "![Describe this screenshot](https://example.com/image.png)\n\n", syntax: "![Alt text](image-url)", preview: "Image figure with optional alt-text caption." },
      { label: "Code / Prompt", template: "```\nPaste code or prompt text here.\n```\n\n", syntax: "``` code block ```", preview: "Copyable prompt/code box." },
      { label: "Copy Prompt", template: "\n[[copy-prompt:1]]\n\n", syntax: "[[copy-prompt:1]]", preview: "Button that copies Prompt 1." },
      { label: "Challenge Prompt", template: "\n[[copy-challenge-prompt]]\n\n", syntax: "[[copy-challenge-prompt]]", preview: "Button that copies the challenge prompt." },
    ],
  },
];

const MARKDOWN_BLOCKS = MARKDOWN_TOOL_GROUPS.flatMap((group) => group.items);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueResourceUrl(resources = [], baseUrl) {
  const usedUrls = new Set(resources.map((item) => item.url).filter(Boolean));
  if (!usedUrls.has(baseUrl)) return baseUrl;

  let count = 2;
  let nextUrl = `${baseUrl}-${count}`;
  while (usedUrls.has(nextUrl)) {
    count += 1;
    nextUrl = `${baseUrl}-${count}`;
  }
  return nextUrl;
}

function sortMonthsForAdmin(items = []) {
  return [...items].sort((a, b) => {
    const aPreset = PRESET_ORDER[a.slug];
    const bPreset = PRESET_ORDER[b.slug];
    if (aPreset != null && bPreset != null) return aPreset - bPreset;
    if (aPreset != null) return -1;
    if (bPreset != null) return 1;
    return String(a.label || a.slug).localeCompare(String(b.label || b.slug));
  });
}

function getDefaultMonthSlug(items = []) {
  const liveMonth = liveMonthFromAdminMonths(items);
  if (liveMonth?.slug) return liveMonth.slug;

  const now = new Date();
  const nextMonthIndex = (now.getMonth() + 1) % 12;
  const nextPreset = UPCOMING_MONTH_PRESETS.find((preset) => {
    const presetMonthIndex = new Date(`${preset.label} 1, ${now.getFullYear()}`).getMonth();
    return presetMonthIndex === nextMonthIndex;
  });

  if (nextPreset && items.some((item) => item.slug === nextPreset.slug)) return nextPreset.slug;
  return items.find((item) => !item.is_published)?.slug || items[0]?.slug || "";
}

function isPersistedMonth(item = {}) {
  return Boolean(item.is_published || item.published_at || item.updated_at);
}

function liveMonthFromAdminMonths(items = []) {
  return [...items]
    .filter((item) => item.is_published)
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))[0] || null;
}

function monthTemplateGuide(label) {
  return `# ${label} Guide: New Mastery Workshop

### The Core Build - everyone does this

---

## Table of Contents

- What You'll Have When Done
- Before You Start
- Quick Words
- Part 1: Build the Core System
- Part 2: Make It Useful
- Part 3: Finish and Secure It
- What's Next
- Safety & Privacy

---

## What You'll Have When Done

You'll have a working system that:

- **Does the main job.** Replace this with the first concrete outcome students get.
- **Remembers the important details.** Replace this with what the system stores or reuses.
- **Runs the key workflow.** Replace this with the action the system can now perform.
- **Looks and feels usable.** Replace this with what makes it ready for real use.

---

## Before You Start

- [ ] **Primary account ready:** Make sure you can sign in before you start the guide. [Open service](https://example.com)
- [ ] **Second service ready:** Make sure the second account is created, verified, and open in the same browser. [Open service](https://example.com)
- [ ] **Starter materials ready:** Download or prepare any starter file, DNA, prompt, or template you will use during the workshop.
- [ ] **Workspace ready:** Open the app, folder, or project where students will build today.

**Note from Igor:** Add the human context, expectation, or reassurance students need before they start.

**Previous experience required:** No previous experience required. Students only need the accounts, files, and workspace listed above.

---

## Quick Words

- **Frontend:** The part students see and click.
- **Backend:** The part that stores data, runs automations, or connects services.

---

# PART 1: BUILD THE CORE SYSTEM

## Step 1: Set Up Your Workspace

Write the first setup step here.

1. First instruction.
2. Second instruction.

## Step 2: Build the First Working Version

Write the first build step here.

1. First instruction.
2. Second instruction.

## Step 3: Test It Once

Write the first test step here.

1. First instruction.
2. Second instruction.

---

# PART 2: MAKE IT YOURS

## Step 4: Customize the System

Write the customization step here.

1. First instruction.
2. Second instruction.

## Step 5: Save the Repeatable Version

Write the reuse step here.

1. First instruction.
2. Second instruction.

## Next Steps

1. Use this once on your own work.
2. Bring your questions to the community.
3. Open the ${label} challenge when you are ready to submit.`;
}

function monthTemplateChallenge(label) {
  return `## The Mission

Write the one-sentence mission for the ${label} challenge here.

## Your Challenge

1. Build the thing from the workshop.
2. Use it on your own work.
3. Capture proof that it works.
4. Submit the strongest version.

## What to Submit

1. Screenshot or proof of the final output.
2. A short note on what you built.
3. The file, prompt, or system artifact if this month requires one.

## Where to Submit

Post to [Challenge Submissions](https://community.aiadvantage.com/c/challenge-submissions/) in the AI Advantage Community.

## Deadline

Add the deadline here.

## Prize

Add the prize here.

## How Winners Are Chosen

Community voting and team evaluation.`;
}

function createMonthTemplate(preset = {}) {
  const slug = slugify(preset.slug || preset.label || "");
  const label = preset.label || slug;
  const topic = preset.topic || "To be announced";
  const focus = preset.focus || `${label} Mastery Workshop`;
  const outcome = preset.outcome || `Prepare ${label}'s guide, live prompts, follow-up resources, recordings, and challenge before this month goes live.`;

  return {
    slug,
    label,
    month_number: label,
    topic,
    focus,
    outcome,
    status: "draft",
    is_published: false,
    hero: {
      src: MONTH_TEMPLATE_HERO_SRC,
      alt: `${label} Mastery workshop`,
      kicker: "Draft month",
      title: `${label}: ${topic}`,
      caption: "Replay, guide, live prompts, challenge, and follow-up resources in one path.",
    },
    resources: [
      {
        category: "Workshop",
        content_ref: "guide",
        type: "Walkthrough",
        title: `${label} Guide`,
        description: "Follow the full walkthrough for this month's build.",
        status: "first draft",
        is_published: false,
        url: `/monthly-resources/${slug}/guide`,
      },
      {
        category: "Workshop",
        content_ref: "prompts",
        type: "Copy-paste",
        title: "Live Prompts",
        description: "Use these alongside the live workshop when you just need the prompts to follow each step.",
        status: "first draft",
        is_published: false,
        url: `/monthly-resources/${slug}/prompts`,
      },
      {
        category: "Other",
        content_ref: "link",
        type: "Recordings",
        title: `${label} Recordings`,
        description: `Add the ${label} workshop replay link here once the recordings are ready.`,
        status: "idea",
        is_published: false,
        url: "",
      },
      {
        category: "Challenge",
        content_ref: "challenge",
        type: "Challenge",
        title: `${label} Challenge`,
        description: "Use what you built this month, submit your version, and see what other members made.",
        status: "first draft",
        is_published: false,
        url: `/challenges/${slug}/guide`,
      },
      {
        category: "Other",
        content_ref: "extras",
        type: "Video + Prompts",
        title: "Go Deeper",
        description: "Use optional follow-up prompts when members are ready to extend the system after the live workshop.",
        status: "idea",
        is_published: false,
        url: `/monthly-resources/${slug}/extras`,
      },
      {
        category: "Next month",
        content_ref: "link",
        type: "Event",
        title: "Next Mastery Workshop",
        description: "Add the next workshop calendar or announcement link here when it is ready.",
        status: "idea",
        is_published: false,
        url: "",
      },
    ],
    guide_markdown: monthTemplateGuide(label),
    guide_toc: {},
    challenge_markdown: monthTemplateChallenge(label),
    challenge_prompt: `Use this space for the main ${label} challenge prompt.`,
    prompts: [
      {
        title: "Prompt 1: Live Workshop Setup",
        text: "Paste the first live workshop prompt here.",
      },
      {
        title: "Prompt 2: Build or Run the System",
        text: "Paste the main build prompt here.",
      },
      {
        title: "Prompt 3: Help Prompt",
        text: "Paste the troubleshooting or help prompt here.",
      },
    ],
    extras: {
      video: {
        eyebrow: "Follow-up video",
        title: `Go Deeper With ${label}`,
        intro: "Use this optional follow-up when you are ready to extend the main workshop system.",
        src: "",
        ariaLabel: `${label} follow-up video`,
      },
      prompts: [
        {
          title: "Follow-up Prompt",
          text: "Paste the first follow-up prompt here.",
        },
      ],
    },
    admin_notes: "Created from the July monthly resources template.",
  };
}

function templateForSlug(slug) {
  const cleanSlug = slugify(slug || "");
  const preset = UPCOMING_MONTH_PRESETS.find((item) => item.slug === cleanSlug);
  return preset ? createMonthTemplate(preset) : null;
}

function mergePresetMonths(items = []) {
  const existing = new Set(items.map((item) => item.slug));
  const templateMonths = UPCOMING_MONTH_PRESETS
    .filter((preset) => !existing.has(preset.slug))
    .map((preset) => createMonthTemplate(preset));

  return sortMonthsForAdmin([...items, ...templateMonths]);
}

function adminDeepLink(slug, tab = "content") {
  return `/admin?month=${encodeURIComponent(slug)}&tab=${encodeURIComponent(tab)}`;
}

function resourceEditorTab(item = {}) {
  if (item.content_kind === "page" || item.content_ref === "page") return "guide";
  if (["guide", "challenge", "prompts", "extras"].includes(item.content_ref)) return item.content_ref;
  if (["link", "system"].includes(item.content_ref)) return null;
  const haystack = `${item.category || ""} ${item.type || ""} ${item.title || ""} ${item.url || ""}`.toLowerCase();
  if (haystack.includes("challenge")) return "challenge";
  if (haystack.includes("extra") || haystack.includes("publishing")) return "extras";
  if (haystack.includes("live") || haystack.includes("prompt") || haystack.includes("/prompts")) return "prompts";
  return "guide";
}

function resourceContentLabel(item = {}) {
  if (item.content_kind === "page" || item.content_ref === "page") return "Independent page";
  return {
    guide: "Shared page: Guide",
    challenge: "Shared page: Challenge",
    prompts: "Shared page: Prompts",
    extras: "Shared page: Extras",
    link: item.url ? "Link card" : "Link needed",
    system: "System page",
  }[item.content_ref] || "Legacy content mapping";
}

function resourceEditActionLabel(item = {}) {
  const tab = resourceEditorTab(item);
  if (!tab) return item.url ? "Open destination" : "Add link to activate";
  if (item.content_kind === "page" || item.content_ref === "page") return "Edit page";
  return `Edit ${tab}`;
}

function isStandaloneResourcePage(item = {}, monthSlug = "") {
  if (!item || (item.content_kind !== "page" && item.content_ref !== "page")) return false;
  if (!monthSlug) return true;
  return String(item.url || "").startsWith(`/monthly-resources/${monthSlug}/`);
}

function normalizedResourceUrl(url = "") {
  try {
    return new URL(url, MASTERY_ORIGIN).pathname.replace(/\/$/, "") || "/";
  } catch {
    return "/";
  }
}

function newResourceId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resourceEditorLabel(tab) {
  return {
    content: "Content",
    "month-setup": "Month setup",
    guide: "Guide markdown",
    challenge: "Challenge content",
    prompts: "Live prompts",
    extras: "Extras",
  }[tab] || "Content";
}

function normalizedResourceStatus(status) {
  if (status === "tested") return "testing";
  if (status === "final") return "final draft";
  return RESOURCE_STATUSES.includes(status) ? status : "idea";
}

function normalizedResourceCategory(category) {
  if (category === "Extras" || category === "Follow up resources") return "Other";
  if (category === "Coming next" || category === "Coming Next") return "Next month";
  return RESOURCE_CATEGORIES.includes(category) ? category : "Other";
}

function normalizeAdminToken(value = "") {
  const trimmed = String(value).trim();
  const hexToken = trimmed.match(/[a-f0-9]{32,}/i);
  if (hexToken) return hexToken[0];
  return trimmed.replace(/[^\x21-\x7e]/g, "");
}

async function adminFetch(token, path, options = {}) {
  const safeToken = normalizeAdminToken(token);
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": safeToken,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("mastery-admin-unauthorized", {
      detail: { message: data.error || "Admin passcode was not accepted" },
    }));
  }
  if (!res.ok) {
    const error = new Error(data.error || "Admin request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function editorSessionId() {
  let value = sessionStorage.getItem(EDITOR_SESSION_KEY);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(EDITOR_SESSION_KEY, value);
  }
  return value;
}

function recoveryStorageKey(slug) {
  return `${RECOVERY_STORAGE_PREFIX}${String(slug || "").toLowerCase()}`;
}

export default function AdminBackend({ navigate }) {
  const { user, isSignedIn } = useUser();
  const [token, setToken] = useState(() => normalizeAdminToken(sessionStorage.getItem(TOKEN_KEY) || ""));
  const [tokenDraft, setTokenDraft] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [months, setMonths] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [month, setMonth] = useState(null);
  const [adminSection, setAdminSection] = useState("content");
  const [activeTab, setActiveTab] = useState("content");
  const [activeResourceTab, setActiveResourceTab] = useState("guide");
  const [guideEditorMode, setGuideEditorMode] = useState("review");
  const [activeResourceIndex, setActiveResourceIndex] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [analyticsReport, setAnalyticsReport] = useState(null);
  const [versions, setVersions] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyState, setHistoryState] = useState("");
  const [status, setStatus] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [error, setError] = useState("");
  const autosaveTimerRef = useRef(null);
  const lastSavedSnapshotRef = useRef("");
  const monthRef = useRef(null);
  const saveRequestIdRef = useRef(0);
  const saveBlockedRef = useRef(false);

  const canLoad = Boolean(token);
  const liveMonthSummary = liveMonthFromAdminMonths(months);
  const liveMonthSlug = liveMonthSummary?.slug || "";
  const userLabel = user?.fullName || user?.primaryEmailAddress?.emailAddress || "admin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get("month");
    const tabParam = params.get("tab");
    if (monthParam) setSelectedSlug(slugify(monthParam));
    if (ADMIN_SECTIONS.includes(tabParam)) {
      setAdminSection(tabParam);
    } else if (tabParam && CONTENT_TABS.includes(tabParam)) {
      setAdminSection("content");
      setActiveTab(tabParam);
    } else if (tabParam && RESOURCE_EDITOR_TABS.includes(tabParam)) {
      setAdminSection("content");
      setActiveTab("content");
      setActiveResourceTab(tabParam);
    }
  }, []);

  useEffect(() => {
    function handleUnauthorized(event) {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken("");
      setTokenDraft("");
      setTokenError(event.detail?.message || "That admin passcode was not accepted. Please try again.");
      setMonths([]);
      setSelectedSlug("");
      setMonth(null);
      setError("");
    }

    window.addEventListener("mastery-admin-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("mastery-admin-unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!canLoad) return;
    loadMonths();
    loadAnalytics();
  }, [canLoad]);

  useEffect(() => {
    if (!selectedSlug || !canLoad) return;
    loadMonth(selectedSlug);
  }, [selectedSlug, canLoad]);

  useEffect(() => {
    monthRef.current = month;
    if (!month?.slug) return;
    const snapshot = JSON.stringify(month);
    if (!lastSavedSnapshotRef.current || snapshot === lastSavedSnapshotRef.current) return;

    try {
      localStorage.setItem(recoveryStorageKey(month.slug), JSON.stringify({
        savedAt: new Date().toISOString(),
        revision: Number(month.revision) || 0,
        month,
      }));
    } catch {
      // Server autosave still runs if this browser blocks local storage.
    }

    setSaveState("dirty");
    setStatus("Unsaved changes");
    if (saveBlockedRef.current) {
      setSaveState("conflict");
      setStatus("A newer team revision exists. Your browser copy is preserved and automatic saving is paused.");
      return;
    }
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      persistMonth(monthRef.current, { source: "auto" });
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [month]);

  useEffect(() => {
    if (!selectedSlug || !canLoad) return undefined;
    let cancelled = false;
    const checkRevision = async () => {
      try {
        const data = await adminFetch(token, `/api/mastery-admin?action=revision&slug=${encodeURIComponent(selectedSlug)}`);
        if (cancelled || !monthRef.current?.slug) return;
        const remoteRevision = Number(data.revision) || 0;
        const localRevision = Number(monthRef.current.revision) || 0;
        if (remoteRevision <= localRevision) return;
        const isClean = JSON.stringify(monthRef.current) === lastSavedSnapshotRef.current;
        if (isClean) {
          await loadMonth(selectedSlug, { checkRecovery: false });
        } else {
          saveBlockedRef.current = true;
          if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
          setSaveState("conflict");
          setStatus(`Team revision ${remoteRevision} is newer. Your local revision ${localRevision} is preserved and saving is paused.`);
        }
      } catch {
        // Keep the editor usable during a transient presence/revision check failure.
      }
    };
    checkRevision();
    const timer = window.setInterval(checkRevision, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedSlug, canLoad, token]);

  async function loadMonths() {
    setError("");
    try {
      const data = await adminFetch(token, "/api/mastery-admin?action=list");
      const sortedMonths = mergePresetMonths(data.months || []);
      setMonths(sortedMonths);
      if (!selectedSlug) setSelectedSlug(getDefaultMonthSlug(sortedMonths));
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMonth(slug, { checkRecovery = true } = {}) {
    setError("");
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=month&slug=${encodeURIComponent(slug)}`);
      const template = templateForSlug(slug);
      const serverMonth = data.month || template;
      let nextMonth = serverMonth;
      let restoredRecovery = false;
      if (checkRecovery) {
        try {
          const stored = JSON.parse(localStorage.getItem(recoveryStorageKey(slug)) || "null");
          if (stored?.month && JSON.stringify(stored.month) !== JSON.stringify(nextMonth)) {
            const restore = window.confirm(`A browser recovery copy from ${new Date(stored.savedAt).toLocaleString()} was found. Restore it now? Cancel keeps the team version and leaves the recovery copy safely stored.`);
            if (restore) {
              nextMonth = stored.month;
              restoredRecovery = true;
            }
          }
        } catch {
          // Ignore malformed or unavailable local recovery data.
        }
      }
      saveBlockedRef.current = false;
      lastSavedSnapshotRef.current = JSON.stringify(serverMonth || null);
      setMonth(nextMonth);
      setActiveResourceIndex(null);
      setSaveState(restoredRecovery ? "dirty" : data.month ? "saved" : "idle");
      setLastSavedAt(data.month ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
      setStatus(restoredRecovery ? "Browser recovery restored. Review it before saving." : data.month ? `Saved at revision ${Number(data.month.revision) || 0}` : template ? "Template ready. Save to create this month." : "");
      if (nextMonth?.slug) await loadHistory(nextMonth.slug);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadHistory(slug = monthRef.current?.slug) {
    if (!slug) {
      setVersions([]);
      return;
    }
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=history&slug=${encodeURIComponent(slug)}`);
      setVersions(data.versions || []);
      setHistoryState("");
    } catch (err) {
      setVersions([]);
      setHistoryState(err.message || "Could not load version history");
    }
  }

  async function loadAnalytics() {
    try {
      const data = await adminFetch(token, "/api/mastery-admin?action=analytics");
      setAnalytics(data.rows || []);
      setAnalyticsReport(data.report || null);
    } catch {
      setAnalytics([]);
      setAnalyticsReport(null);
    }
  }

  function unlock(event) {
    event.preventDefault();
    const nextToken = normalizeAdminToken(tokenDraft);
    if (!nextToken) return;
    setTokenError("");
    sessionStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setTokenDraft("");
  }

  function updateMonth(patch) {
    setMonth((current) => ({ ...current, ...patch }));
  }

  function updateHero(field, value) {
    setMonth((current) => ({
      ...current,
      hero: { ...(current?.hero || {}), [field]: value },
    }));
  }

  function updateResource(index, field, value) {
    setMonth((current) => ({
      ...current,
      resources: (current?.resources || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  function addResource(category = "Workshop") {
    const cleanCategory = normalizedResourceCategory(category);
    const nextIndex = (monthRef.current?.resources || []).length;
    if (cleanCategory === "Workshop" || cleanCategory === "Challenge") {
      setActiveResourceIndex(nextIndex);
      setActiveResourceTab("guide");
    }
    setMonth((current) => {
      const resources = current?.resources || [];
      const monthSlug = current?.slug || slugify(current?.label || "month");
      const label = current?.label || "New Month";
      const nextResource = {
        category: cleanCategory,
        type: "Resource",
        title: `New ${cleanCategory} Card`,
        description: "Placeholder description. Replace this with the one-sentence member-facing reason to open this card.",
        status: "outline",
        is_published: false,
        url: "",
      };
      if (cleanCategory === "Workshop") {
        const baseUrl = `/monthly-resources/${monthSlug}/guide/${slugify(`${label} workshop guide`) || "workshop-guide"}`;
        nextResource.id = newResourceId();
        nextResource.content_ref = "page";
        nextResource.content_kind = "page";
        nextResource.type = "Walkthrough";
        nextResource.title = `${label} Workshop Guide`;
        nextResource.description = "Placeholder workshop description. Replace this with what members will build and why it matters.";
        nextResource.url = uniqueResourceUrl(resources, baseUrl);
        nextResource.content_markdown = monthTemplateGuide(label);
        nextResource.content_toc = {};
      } else if (cleanCategory === "Challenge") {
        const pageSlug = slugify(`${label} challenge`) || "challenge";
        nextResource.id = newResourceId();
        nextResource.content_ref = "page";
        nextResource.content_kind = "page";
        nextResource.type = "Challenge";
        nextResource.title = `${label} Challenge`;
        nextResource.description = "Placeholder challenge description. Replace this with what members should submit.";
        nextResource.url = uniqueResourceUrl(resources, `/monthly-resources/${monthSlug}/pages/${pageSlug}`);
        nextResource.content_markdown = monthTemplateChallenge(label);
        nextResource.content_toc = {};
      } else if (cleanCategory === "Next month") {
        nextResource.content_ref = "link";
        nextResource.type = "Event";
        nextResource.title = "Next Mastery Workshop";
        nextResource.description = "Placeholder next-month description. Replace this with the next workshop announcement or calendar context.";
      } else {
        nextResource.content_ref = "link";
      }

      return {
        ...current,
        resources: [...resources, nextResource],
      };
    });
  }

  function removeResource(index) {
    setMonth((current) => ({
      ...current,
      resources: (current?.resources || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function moveResource(index, direction) {
    setMonth((current) => {
      const resources = [...(current?.resources || [])];
      const category = normalizedResourceCategory(resources[index]?.category);
      const categoryIndexes = resources
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => normalizedResourceCategory(item.category) === category)
        .map(({ itemIndex }) => itemIndex);
      const currentCategoryIndex = categoryIndexes.indexOf(index);
      const nextIndex = categoryIndexes[currentCategoryIndex + direction];
      if (nextIndex == null) return current;
      [resources[index], resources[nextIndex]] = [resources[nextIndex], resources[index]];
      return { ...current, resources };
    });
    setActiveResourceIndex((current) => {
      const resources = monthRef.current?.resources || [];
      const category = normalizedResourceCategory(resources[index]?.category);
      const categoryIndexes = resources
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => normalizedResourceCategory(item.category) === category)
        .map(({ itemIndex }) => itemIndex);
      const currentCategoryIndex = categoryIndexes.indexOf(index);
      const nextIndex = categoryIndexes[currentCategoryIndex + direction];
      if (nextIndex == null) return current;
      if (current === index) return nextIndex;
      if (current === nextIndex) return index;
      return current;
    });
  }

  function updatePrompt(index, field, value) {
    setMonth((current) => ({
      ...current,
      prompts: (current?.prompts || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  function addPrompt() {
    setMonth((current) => ({
      ...current,
      prompts: [...(current?.prompts || []), { title: "New Prompt", text: "" }],
    }));
  }

  function removePrompt(index) {
    setMonth((current) => ({
      ...current,
      prompts: (current?.prompts || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateExtras(patch) {
    setMonth((current) => ({
      ...current,
      extras: { ...(current?.extras || {}), ...patch },
    }));
  }

  function updateExtraPrompt(index, field, value) {
    setMonth((current) => {
      const extras = current?.extras || {};
      return {
        ...current,
        extras: {
          ...extras,
          prompts: (extras.prompts || []).map((item, itemIndex) => (
            itemIndex === index ? { ...item, [field]: value } : item
          )),
        },
      };
    });
  }

  function addExtraPrompt() {
    setMonth((current) => {
      const extras = current?.extras || {};
      return {
        ...current,
        extras: {
          ...extras,
          prompts: [...(extras.prompts || []), { title: "New Extra", text: "" }],
        },
      };
    });
  }

  function removeExtraPrompt(index) {
    setMonth((current) => {
      const extras = current?.extras || {};
      return {
        ...current,
        extras: {
          ...extras,
          prompts: (extras.prompts || []).filter((_, itemIndex) => itemIndex !== index),
        },
      };
    });
  }

  async function persistMonth(monthToSave = monthRef.current, { source = "manual" } = {}) {
    if (!monthToSave) return null;
    if (saveBlockedRef.current) {
      setSaveState("conflict");
      setStatus("Saving is paused because a newer team revision exists. Your browser recovery copy is preserved.");
      return null;
    }
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    const requestSnapshot = JSON.stringify(monthToSave);
    setSaveState("saving");
    setStatus(source === "auto" ? "Autosaving..." : "Saving...");
    setError("");
    try {
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          source,
          expected_revision: Number(monthToSave.revision) || 0,
          month: { ...monthToSave, updated_by: userLabel },
        }),
      });
      const currentSnapshot = JSON.stringify(monthRef.current);
      if (requestId === saveRequestIdRef.current && currentSnapshot === requestSnapshot) {
        saveBlockedRef.current = false;
        lastSavedSnapshotRef.current = JSON.stringify(data.month);
        setMonth(data.month);
        setSaveState("saved");
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setStatus(source === "auto" ? "Draft autosaved" : "Version saved");
        try { localStorage.removeItem(recoveryStorageKey(data.month.slug)); } catch {}
        if (source !== "auto") await loadHistory(data.month.slug);
      } else {
        setSaveState("dirty");
        setStatus("Unsaved changes");
      }
      if (data.month?.slug) setSelectedSlug(data.month.slug);
      await loadMonths();
      return data.month;
    } catch (err) {
      if (err.status === 409) {
        saveBlockedRef.current = true;
        setError("");
        setSaveState("conflict");
        setStatus(`${err.message} Team revision ${Number(err.data?.month?.revision) || "unknown"} is available. Automatic saving is paused.`);
      } else {
        setError(err.message);
        setSaveState("error");
        setStatus("Save failed. Your browser recovery copy is preserved.");
      }
      return null;
    }
  }

  async function saveMonth() {
    await persistMonth(monthRef.current, { source: "manual" });
  }

  function openFullPreview() {
    const currentMonth = monthRef.current;
    if (!currentMonth?.slug) return;

    const resource = currentMonth.resources?.[activeResourceIndex];
    const isResourcePage = isStandaloneResourcePage(resource, currentMonth.slug);
    const content = isResourcePage ? resource.content_markdown || "" : currentMonth.guide_markdown || "";
    const previewId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const pagePath = isResourcePage
      ? normalizedResourceUrl(resource.url || `/monthly-resources/${currentMonth.slug}/guide/${slugify(resource.title || "preview")}`)
      : `/monthly-resources/${currentMonth.slug}/guide`;

    const payload = {
      createdAt: Date.now(),
      monthSlug: currentMonth.slug,
      monthLabel: currentMonth.label || currentMonth.slug,
      monthTopic: currentMonth.topic || "",
      monthFocus: currentMonth.focus || "",
      path: pagePath,
      pageTitle: isResourcePage
        ? resource.title || `${currentMonth.label || "Month"} Workshop Page`
        : `${currentMonth.label || "Month"} Guide: ${currentMonth.focus || currentMonth.topic || "Mastery Workshop"}`,
      pageIntro: isResourcePage
        ? resource.description || "Follow this page for the workshop."
        : currentMonth.outcome || "Follow the written guide for this month.",
      pageLabel: isResourcePage ? resource.title || "Workshop Page" : "Guide",
      showGuideVideo: !isResourcePage,
      content: {
        guide: content,
        guideToc: {},
        challengePrompt: currentMonth.challenge_prompt || "",
        prompts: Array.isArray(currentMonth.prompts) ? currentMonth.prompts : [],
      },
    };

    try {
      localStorage.setItem(`${FULL_PREVIEW_STORAGE_PREFIX}${previewId}`, JSON.stringify(payload));
      window.open(`/admin/full-preview?preview=${encodeURIComponent(previewId)}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Could not open the full preview.");
    }
  }

  async function restoreVersion(version) {
    if (!version?.id || !month?.slug) return;
    const label = version.snapshot?.label || month.label || month.slug;
    const when = version.created_at ? new Date(version.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "this version";
    const confirmed = window.confirm(`Restore ${label} from ${when}? The current draft will be archived first.`);
    if (!confirmed) return;

    setHistoryState("Restoring version...");
    setError("");
    try {
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "restore-version",
          version_id: version.id,
          updated_by: userLabel,
          expected_revision: Number(month.revision) || 0,
        }),
      });
      lastSavedSnapshotRef.current = JSON.stringify(data.month);
      saveBlockedRef.current = false;
      try { localStorage.removeItem(recoveryStorageKey(data.month.slug)); } catch {}
      setMonth(data.month);
      setSaveState("saved");
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setStatus("Version restored");
      await loadMonths();
      await loadHistory(data.month.slug);
      setHistoryState("Restored");
    } catch (err) {
      setHistoryState("");
      setError(err.message);
    }
  }

  async function setLiveMonth(slug = month?.slug) {
    const liveSlug = slugify(slug || "");
    if (!liveSlug) return;
    const targetSummary = months.find((item) => item.slug === liveSlug);
    const targetIsSelectedMonth = month?.slug === liveSlug;
    const currentSnapshot = JSON.stringify(monthRef.current);
    if (targetIsSelectedMonth && currentSnapshot !== lastSavedSnapshotRef.current) {
      const savedMonth = await persistMonth(monthRef.current, { source: "manual" });
      if (!savedMonth) return;
    }
    if (!targetIsSelectedMonth && targetSummary && !isPersistedMonth(targetSummary)) {
      setError("Save this month before making it live.");
      return;
    }

    const label = targetSummary?.label || (targetIsSelectedMonth ? month?.label : liveSlug) || liveSlug;
    const confirmed = window.confirm(`Make ${label} the live month? The previous live month will move to Past Workshops.`);
    if (!confirmed) return;

    setStatus("Updating live month...");
    setError("");
    try {
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "set-live-month",
          slug: liveSlug,
          updated_by: userLabel,
        }),
      });
      if (month?.slug === data.month?.slug) {
        lastSavedSnapshotRef.current = JSON.stringify(data.month);
        setMonth(data.month);
      }
      await loadMonths();
      setStatus(`${data.month?.label || label} is now the live month.`);
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  const analyticsTotal = useMemo(
    () => analytics.reduce((total, row) => total + Number(row.clicks || 0), 0),
    [analytics]
  );

  if (!isSignedIn) {
    return (
      <section className="section page-section admin-shell">
        <div className="section-heading">
          <p className="section-kicker">Admin</p>
          <h1 className="page-title">Sign in before opening the admin backend.</h1>
          <p className="muted">Use the same Mastery account first, then enter the admin passcode.</p>
          <button type="button" onClick={() => navigate("/sign-in")}>Sign in</button>
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="section page-section admin-shell">
        <div className="admin-lock">
          <p className="section-kicker">Admin</p>
          <h1 className="page-title">Mastery admin backend.</h1>
          <p className="muted">Enter the admin passcode for this browser session. Draft writes stay behind the server API.</p>
          {tokenError && <p className="admin-auth-error" role="alert">{tokenError}</p>}
          <form onSubmit={unlock}>
            <input
              type="password"
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              placeholder="Admin passcode"
            />
            <button type="submit">Unlock Admin</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section page-section admin-shell" aria-labelledby="admin-title">
      <div className="admin-head">
        <div>
          <p className="section-kicker">Admin backend</p>
          <h1 id="admin-title" className="page-title">Mastery content backend.</h1>
          <p className="muted">Edit each month here. Keep it in draft until the content is ready for members.</p>
        </div>
        {adminSection === "content" && <div className="admin-head-actions">
          <SaveStatusButton
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            onClick={saveMonth}
            disabled={!month || saveState === "saving" || saveState === "conflict"}
          />
          <button
            type="button"
            className="admin-history-toggle"
            onClick={() => {
              setHistoryOpen((value) => !value);
              if (!historyOpen) loadHistory(month?.slug);
            }}
            disabled={!month?.slug}
            title="Version history. Restore a previous autosaved version of this month."
          >
            Version History
          </button>
        </div>}
      </div>

      {(status || error) && (
        <div className={`admin-status ${error ? "error" : ""}`}>
          {error || status}
        </div>
      )}

      {historyOpen && adminSection === "content" && (
        <VersionHistoryPanel
          versions={versions}
          state={historyState}
          onRefresh={() => loadHistory(month?.slug)}
          onRestore={restoreVersion}
        />
      )}

      <div className="admin-top-tabs" aria-label="Admin sections">
        {ADMIN_SECTIONS.map((section) => (
          <button
            key={section}
            type="button"
            className={adminSection === section ? "active" : ""}
            onClick={() => {
              setAdminSection(section);
              window.history.replaceState(
                {},
                "",
                section === "content"
                  ? adminDeepLink(selectedSlug || getDefaultMonthSlug(months), activeTab)
                  : `/admin?tab=${section}`,
              );
            }}
          >
            {section}
          </button>
        ))}
      </div>

      {adminSection === "analytics" ? (
        <main className="admin-main">
          <AnalyticsPanel rows={analytics} report={analyticsReport} total={analyticsTotal} refresh={loadAnalytics} />
        </main>
      ) : adminSection === "requests" ? (
        <MasteryRequests token={token} user={user} />
      ) : (
        <div className="admin-layout admin-layout-single">
          <main className="admin-main">
            <div className="admin-content-toolbar">
              <label>
                Month
                <select
                  value={selectedSlug}
                  onChange={(event) => {
                    const nextSlug = event.target.value;
                    setSelectedSlug(nextSlug);
                    window.history.replaceState({}, "", adminDeepLink(nextSlug, activeTab));
                  }}
                >
                  {months.map((item) => (
                    <option value={item.slug} key={item.slug}>
                      {item.label} ({item.slug === liveMonthSlug ? "Live" : item.is_published ? "Past" : item.status})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Live month
                <select
                  value={liveMonthSlug}
                  onChange={(event) => setLiveMonth(event.target.value)}
                >
                  <option value="" disabled>Select live month</option>
                  {months.map((item) => (
                    <option value={item.slug} key={`live-${item.slug}`} disabled={!isPersistedMonth(item)}>
                      {item.label}{isPersistedMonth(item) ? "" : " (save first)"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-tabs admin-tabs-inline" aria-label="Month editor tabs">
                {CONTENT_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => {
                      setActiveTab(tab);
                      window.history.replaceState({}, "", adminDeepLink(selectedSlug || getDefaultMonthSlug(months), tab));
                    }}
                  >
                    {resourceEditorLabel(tab)}
                  </button>
                ))}
              </div>
            </div>

            {!month ? (
              <div className="admin-empty">
                <h2>Select a month.</h2>
                <p>Use the resource cards as the main editing map for each draft month.</p>
              </div>
            ) : (
              <div className="admin-stack">
                {activeTab === "month-setup" ? (
                  <BasicsEditor
                    mode="month-setup"
                    month={month}
                    token={token}
                    updateMonth={updateMonth}
                    updateHero={updateHero}
                  />
                ) : (
                  <>
                    <BasicsEditor
                      mode="content"
                      month={month}
                      token={token}
                      updateResource={updateResource}
                      addResource={addResource}
                      removeResource={removeResource}
                      moveResource={moveResource}
                      activeResourceIndex={activeResourceIndex}
                      onEditResource={(item, index) => {
                        const nextTab = resourceEditorTab(item);
                        setActiveResourceIndex(index);
                        setActiveResourceTab(nextTab);
                        window.history.replaceState({}, "", adminDeepLink(selectedSlug || getDefaultMonthSlug(months), "content"));
                        requestAnimationFrame(() => {
                          document.getElementById("admin-resource-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                      }}
                    />

                    <section className="admin-card admin-card-wide" id="admin-resource-editor">
                      <div className="admin-section-actions">
                        <div>
                          <h2>Selected card content</h2>
                          {activeResourceIndex != null && month.resources?.[activeResourceIndex]?.title && (
                            <p className="muted">{month.resources[activeResourceIndex].title}</p>
                          )}
                        </div>
                        {activeResourceTab === "guide" && (
                          <>
                            <button
                              type="button"
                              className="admin-full-preview-button"
                              onClick={openFullPreview}
                              disabled={!month?.slug}
                              title="Open this draft in the full customer-facing guide page."
                            >
                              Full Preview
                            </button>
                            <EditorModeToggle mode={guideEditorMode} onChange={setGuideEditorMode} />
                          </>
                        )}
                      </div>
                      {activeResourceTab === "guide" && (
                        <div className="admin-stack">
                          <GuideNavigationNotice />
                          <MarkdownBoxEditor
                            title={isStandaloneResourcePage(month.resources?.[activeResourceIndex], month.slug)
                              ? `${month.resources[activeResourceIndex].title || "Page"} markdown`
                              : "Guide markdown"}
                            value={isStandaloneResourcePage(month.resources?.[activeResourceIndex], month.slug)
                              ? month.resources[activeResourceIndex].content_markdown || ""
                              : month.guide_markdown || ""}
                            onChange={(value) => {
                              if (isStandaloneResourcePage(month.resources?.[activeResourceIndex], month.slug)) {
                                updateResource(activeResourceIndex, "content_markdown", value);
                              } else {
                                updateMonth({ guide_markdown: value });
                              }
                            }}
                            previewKind="guide"
                            previewConfig={{}}
                            token={token}
                            monthSlug={month.slug}
                            documentKey={isStandaloneResourcePage(month.resources?.[activeResourceIndex], month.slug)
                              ? `resource-${month.resources[activeResourceIndex].id || slugify(month.resources[activeResourceIndex].url || "page")}`
                              : "guide"}
                            actor={{ id: user?.id, name: user?.fullName || userLabel, email: user?.primaryEmailAddress?.emailAddress || "", avatar: user?.imageUrl || "" }}
                            sourceRevision={Number(month.revision) || 0}
                            hideHeader
                            mode={guideEditorMode}
                            onModeChange={setGuideEditorMode}
                          />
                        </div>
                      )}
                      {activeResourceTab === "challenge" && (
                        <div className="admin-stack">
                          <MarkdownBoxEditor
                            title="Challenge markdown"
                            value={month.challenge_markdown || ""}
                            onChange={(value) => updateMonth({ challenge_markdown: value })}
                            previewKind="challenge"
                            token={token}
                            monthSlug={month.slug}
                            documentKey="challenge"
                            actor={{ id: user?.id, name: user?.fullName || userLabel, email: user?.primaryEmailAddress?.emailAddress || "", avatar: user?.imageUrl || "" }}
                            sourceRevision={Number(month.revision) || 0}
                          />
                          <MarkdownBoxEditor
                            title="Challenge prompt"
                            value={month.challenge_prompt || ""}
                            onChange={(value) => updateMonth({ challenge_prompt: value })}
                            previewKind="document"
                            token={token}
                            monthSlug={month.slug}
                            documentKey="challenge-prompt"
                            actor={{ id: user?.id, name: user?.fullName || userLabel, email: user?.primaryEmailAddress?.emailAddress || "", avatar: user?.imageUrl || "" }}
                            sourceRevision={Number(month.revision) || 0}
                          />
                        </div>
                      )}
                      {activeResourceTab === "prompts" && (
                        <PromptEditor
                          prompts={month.prompts || []}
                          updatePrompt={updatePrompt}
                          addPrompt={addPrompt}
                          removePrompt={removePrompt}
                          token={token}
                          monthSlug={month.slug}
                        />
                      )}
                      {activeResourceTab === "extras" && (
                        <ExtrasEditor
                          extras={month.extras || {}}
                          adminNotes={month.admin_notes || ""}
                          updateExtras={updateExtras}
                          updateAdminNotes={(value) => updateMonth({ admin_notes: value })}
                          updateExtraPrompt={updateExtraPrompt}
                          addExtraPrompt={addExtraPrompt}
                          removeExtraPrompt={removeExtraPrompt}
                          token={token}
                          monthSlug={month.slug}
                        />
                      )}
                    </section>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </section>
  );
}

function SaveStatusButton({ saveState, lastSavedAt, onClick, disabled }) {
  const labels = {
    idle: "Save version",
    dirty: "Save version",
    saving: "Saving...",
    saved: "Save version",
    error: "Save failed",
    conflict: "Refresh required",
  };

  return (
    <button
      type="button"
      className={`save-status-button save-status-${saveState}`}
      onClick={onClick}
      disabled={disabled}
      title={`Autosave protects the draft${lastSavedAt ? ` (last saved ${lastSavedAt})` : ""}. Click to create a team checkpoint.`}
    >
      {labels[saveState] || "Save"}
    </button>
  );
}

const VERSION_FIELDS = [
  ["focus", "Workshop title"],
  ["outcome", "Outcome"],
  ["hero", "Hero"],
  ["resources", "Resources"],
  ["guide_markdown", "Guide"],
  ["guide_toc", "Guide navigation"],
  ["challenge_markdown", "Challenge"],
  ["challenge_prompt", "Challenge prompt"],
  ["prompts", "Prompts"],
  ["extras", "Extras"],
  ["admin_notes", "Admin notes"],
];

function diffText(value) {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}

function compactChange(beforeValue, afterValue) {
  const before = diffText(beforeValue).trim().split(/\s+/).filter(Boolean);
  const after = diffText(afterValue).trim().split(/\s+/).filter(Boolean);
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start += 1;
  let beforeEnd = before.length - 1;
  let afterEnd = after.length - 1;
  while (beforeEnd >= start && afterEnd >= start && before[beforeEnd] === after[afterEnd]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  const removed = before.slice(start, beforeEnd + 1);
  const added = after.slice(start, afterEnd + 1);
  return {
    added: added.length,
    removed: removed.length,
    addedText: added.join(" ").slice(0, 220),
    removedText: removed.join(" ").slice(0, 220),
  };
}

function versionChanges(version = {}, previousVersion) {
  if (!previousVersion?.snapshot) return [];
  return VERSION_FIELDS.flatMap(([key, label]) => {
    const before = previousVersion.snapshot?.[key];
    const after = version.snapshot?.[key];
    if (diffText(before) === diffText(after)) return [];
    return [{ key, label, ...compactChange(before, after) }];
  });
}

function versionTime(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VersionHistoryPanel({ versions, state, onRefresh, onRestore }) {
  return (
    <section className="admin-card admin-history-panel" aria-label="Version history">
      <div className="admin-section-actions">
        <div>
          <p className="section-kicker">Team checkpoints</p>
          <h2>Version history</h2>
          <p className="muted">Autosave protects the working draft quietly. A version appears here only when someone clicks Save version.</p>
        </div>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </div>
      {state && <p className="admin-upload-status">{state}</p>}
      {versions.length ? (
        <div className="admin-version-list">
          {versions.map((version, index) => {
            const changes = versionChanges(version, versions[index + 1]);
            return (
            <article className="admin-version-item" key={version.id}>
              <div>
                <strong>{versionTime(version.created_at)}</strong>
                <small>
                  {version.saved_by ? `Saved by ${version.saved_by}` : "Saved team version"}
                </small>
                {changes.length ? (
                  <details className="admin-version-changes">
                    <summary>
                      {changes.map((change) => change.label).join(", ")} changed
                    </summary>
                    <div className="admin-version-change-list">
                      {changes.map((change) => (
                        <div className="admin-version-change" key={change.key}>
                          <b>{change.label}</b>
                          <span className="admin-diff-count added">+{change.added}</span>
                          <span className="admin-diff-count removed">−{change.removed}</span>
                          {change.addedText && <p className="admin-diff-added">Added: {change.addedText}{change.addedText.length >= 220 ? "…" : ""}</p>}
                          {change.removedText && <p className="admin-diff-removed">Deleted: {change.removedText}{change.removedText.length >= 220 ? "…" : ""}</p>}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <p>{index === versions.length - 1 ? "First saved team version" : "Saved month version"}</p>
                )}
              </div>
              <button type="button" onClick={() => onRestore(version)}>Restore</button>
            </article>
          )})}
        </div>
      ) : (
        <p className="muted">No team versions yet. Autosave is protecting the draft. Click Save version when a meaningful round of work is done.</p>
      )}
    </section>
  );
}

function BasicsEditor({
  mode = "content",
  month,
  token,
  updateMonth,
  updateHero,
  updateResource,
  addResource,
  removeResource,
  moveResource,
  activeResourceIndex,
  onEditResource,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [heroUploadState, setHeroUploadState] = useState("");
  const heroFileInputRef = useRef(null);
  const permanentWorkshopLink = `${MASTERY_ORIGIN}/workshops/${WORKSHOP_YEAR}/${month.slug || "month"}`;

  function readHeroFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadHeroImage(file) {
    if (!file) return;
    setHeroUploadState("Uploading image...");
    try {
      const dataUrl = await readHeroFileAsDataUrl(file);
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "upload-image",
          month_slug: month.slug || "shared",
          file_name: file.name,
          content_type: file.type,
          data: dataUrl,
        }),
      });
      updateHero("src", data.url);
      if (!month.hero?.alt) {
        updateHero("alt", `${month.label || "Mastery"} workshop image`);
      }
      setHeroUploadState("Image uploaded and added to the hero");
      window.setTimeout(() => setHeroUploadState(""), 2500);
    } catch (err) {
      setHeroUploadState(err.message || "Image upload failed");
    } finally {
      if (heroFileInputRef.current) heroFileInputRef.current.value = "";
    }
  }

  async function copyPermanentWorkshopLink() {
    await navigator.clipboard.writeText(permanentWorkshopLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1600);
  }

  return (
    <div className="admin-card-grid">
      {mode === "month-setup" && (
      <>
      <div className="admin-card">
        <div className="admin-section-actions">
          <h2>Month setup</h2>
        </div>
        <p className="admin-system-value"><span>Editing month</span><strong>{month.label || month.month_number || "Month"}</strong></p>
        <label>Topic<input value={month.topic || ""} onChange={(event) => updateMonth({ topic: event.target.value })} /></label>
        <label>Focus<input value={month.focus || ""} onChange={(event) => updateMonth({ focus: event.target.value })} /></label>
        <label>Outcome<textarea value={month.outcome || ""} onChange={(event) => updateMonth({ outcome: event.target.value })} rows={3} /></label>
        <label>
          Permanent workshop link
          <span className="admin-copy-field">
            <input value={permanentWorkshopLink} readOnly />
            <button type="button" onClick={copyPermanentWorkshopLink}>{linkCopied ? "Copied" : "Copy"}</button>
          </span>
        </label>
        <p className="muted">Use this dated link in emails, calendar events, and shared resources. It will never move to a different month.</p>
        <div className="admin-field-preview" aria-label="Page settings preview">
          <span className="admin-preview-label">Frontend preview</span>
          <div className="admin-month-copy-preview">
            <p className="section-kicker">{month.month_number || month.label}</p>
            <h3>{month.focus || `${month.label || "Month"} Mastery Workshop`}</h3>
            <p>{month.outcome || "The workshop outcome will appear here."}</p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <h2>Workshop Page</h2>
        <input
          ref={heroFileInputRef}
          className="admin-file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => uploadHeroImage(event.target.files?.[0])}
        />
        <button className="admin-image-upload-button" type="button" onClick={() => heroFileInputRef.current?.click()}>
          {month.hero?.src ? "Replace hero image" : "Upload hero image"}
        </button>
        {heroUploadState && <p className="admin-upload-status">{heroUploadState}</p>}
        <label>Alt text<input value={month.hero?.alt || ""} onChange={(event) => updateHero("alt", event.target.value)} /></label>
        <label>Title<input value={month.hero?.title || ""} onChange={(event) => updateHero("title", event.target.value)} /></label>
        <label>Caption<textarea value={month.hero?.caption || ""} onChange={(event) => updateHero("caption", event.target.value)} rows={3} /></label>
        <div className="admin-field-preview" aria-label="Hero preview">
          <span className="admin-preview-label">Frontend preview</span>
          {month.hero?.src ? (
            <figure className="admin-hero-preview">
              <img src={month.hero.src} alt={month.hero.alt || ""} />
              <figcaption>
                <span>{month.hero?.kicker || "Published month"}</span>
                <strong>{month.hero?.title || `${month.label}: ${month.topic || "Mastery"}`}</strong>
                {month.hero?.caption && <small>{month.hero.caption}</small>}
              </figcaption>
            </figure>
          ) : (
            <p className="admin-preview-empty">Upload an image to preview the hero.</p>
          )}
        </div>
      </div>
      </>
      )}
      {mode === "content" && (
      <div className="admin-card admin-card-wide">
        <div className="admin-section-actions">
          <div>
            <h2>Resource cards</h2>
            <p className="muted">Categories stay in the same frontend order. Flip status to Published when a card is ready for members.</p>
          </div>
        </div>
        <div className="admin-resource-sections" aria-label="Resource cards">
          {RESOURCE_CATEGORIES.map((category) => {
            const categoryItems = (month.resources || [])
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => normalizedResourceCategory(item.category) === category);

            return (
              <section className="admin-resource-category" key={category}>
                <div className="admin-resource-category-head">
                  <div>
                    <h3>{category}</h3>
                    <p>{categoryItems.length ? `${categoryItems.length} card${categoryItems.length === 1 ? "" : "s"}` : "No cards yet"}</p>
                  </div>
                  <button type="button" onClick={() => addResource(category)}>Add {category} Card</button>
                </div>

                <div className="admin-resource-card-list">
                  {categoryItems.map(({ item, index }, categoryIndex) => (
                    <article className={`admin-resource-editor-card${activeResourceIndex === index ? " active" : ""}`} key={`${item.type}-${index}`}>
                      <div className="admin-resource-editor-main">
                        <div className="admin-resource-editor-top">
                          <label className="admin-resource-field admin-resource-type"><span>Type</span><input value={item.type || ""} onChange={(event) => updateResource(index, "type", event.target.value)} placeholder="Type" aria-label="Type" /></label>
                          <label className="admin-resource-field admin-resource-title"><span>Title</span><input value={item.title || ""} onChange={(event) => updateResource(index, "title", event.target.value)} placeholder="Title" aria-label="Title" /></label>
                          <label className="admin-resource-field admin-resource-status"><span>Status</span><select
                            value={normalizedResourceStatus(item.status)}
                            onChange={(event) => {
                              const nextStatus = event.target.value;
                              updateResource(index, "status", nextStatus);
                              updateResource(index, "is_published", nextStatus === "published");
                            }}
                            aria-label="Status"
                          >
                            {RESOURCE_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
                          </select></label>
                        </div>
                        <label className="admin-resource-field"><span>Description</span><textarea value={item.description || ""} onChange={(event) => updateResource(index, "description", event.target.value)} placeholder="Description" rows={3} aria-label="Description" /></label>
                        <label className="admin-resource-field"><span>Link</span><input value={item.url || ""} onChange={(event) => updateResource(index, "url", event.target.value)} placeholder="Link" aria-label="Link" /></label>
                        <p className="admin-resource-content-kind">{resourceContentLabel(item)}</p>
                      </div>

                      <div className="admin-resource-actions">
                        <div className="admin-order-actions" aria-label={`Reorder ${item.title || `resource card`}`}>
                          <button type="button" onClick={() => moveResource(index, -1)} disabled={categoryIndex === 0} aria-label="Move up">↑</button>
                          <button type="button" onClick={() => moveResource(index, 1)} disabled={categoryIndex === categoryItems.length - 1} aria-label="Move down">↓</button>
                        </div>
                        {resourceEditorTab(item) ? (
                          <button
                            type="button"
                            className={activeResourceIndex === index ? "active" : ""}
                            onClick={() => onEditResource(item, index)}
                          >
                            {resourceEditActionLabel(item)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!item.url}
                            onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                          >
                            {resourceEditActionLabel(item)}
                          </button>
                        )}
                        <button type="button" className="danger" onClick={() => removeResource(index)}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

function EditorModeToggle({ mode, onChange }) {
  return (
    <div className="markdown-editor-mode" aria-label="Editor mode">
      <button type="button" className={mode === "review" ? "active" : ""} onClick={() => onChange("review")}>Review</button>
      <button type="button" className={mode === "edit" ? "active" : ""} onClick={() => onChange("edit")}>Advanced Markdown</button>
    </div>
  );
}

function GuideNavigationNotice() {
  return (
    <section className="guide-toc-editor">
      <div className="guide-toc-editor-head">
        <div>
          <p className="section-kicker">Side navigation</p>
          <h3>Guide contents</h3>
          <p>Generated only from the Markdown below. Use <strong>Step Card</strong> blocks for numbered cards, <strong>Part Break</strong> blocks to group those cards, and <strong>Subheading</strong> inside a card.</p>
        </div>
      </div>
    </section>
  );
}

function markdownReviewOutline(content = "") {
  return content.split("\n").flatMap((line) => {
    const match = line.trim().match(/^(#{1,3})\s+(.+)$/);
    if (!match || match[2] === "Table of Contents") return [];
    const title = match[2].replace(/[*_`]/g, "").trim();
    return [{ level: match[1].length, title, id: sectionId(title) }];
  });
}

function markdownRangeForRenderedText(content = "", selectedText = "", occurrence = 0) {
  const needle = selectedText.replace(/\s+/g, " ").trim();
  if (!needle) return null;
  const plain = [];
  const rawIndexes = [];
  let inLinkTarget = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === "]" && next === "(") {
      inLinkTarget = true;
      index += 1;
      continue;
    }
    if (inLinkTarget) {
      if (char === ")") inLinkTarget = false;
      continue;
    }
    if (char === "[" || char === "]" || char === "*" || char === "`" || char === "#") continue;
    const normalized = /\s/.test(char) ? " " : char;
    if (normalized === " " && plain.at(-1) === " ") continue;
    plain.push(normalized);
    rawIndexes.push(index);
  }
  const haystack = plain.join("");
  let plainStart = -1;
  let searchFrom = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    plainStart = haystack.indexOf(needle, searchFrom);
    if (plainStart < 0) break;
    searchFrom = plainStart + needle.length;
  }
  if (plainStart < 0) return null;
  const plainEnd = plainStart + needle.length - 1;
  return {
    start: rawIndexes[plainStart] ?? 0,
    end: (rawIndexes[plainEnd] ?? rawIndexes[plainStart] ?? 0) + 1,
    quotedText: needle,
  };
}

function selectRenderedQuote(root, quotedText = "", occurrence = 0) {
  if (!root || !quotedText.trim()) return false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let text = "";
  while (walker.nextNode()) {
    nodes.push({ node: walker.currentNode, start: text.length, end: text.length + walker.currentNode.textContent.length });
    text += walker.currentNode.textContent;
  }
  let start = -1;
  let searchFrom = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    start = text.indexOf(quotedText, searchFrom);
    if (start < 0) break;
    searchFrom = start + quotedText.length;
  }
  if (start < 0) return false;
  const end = start + quotedText.length;
  const startNode = nodes.find((item) => item.start <= start && item.end >= start);
  const endNode = nodes.find((item) => item.start <= end && item.end >= end) || startNode;
  if (!startNode || !endNode) return false;
  const range = document.createRange();
  range.setStart(startNode.node, Math.max(0, start - startNode.start));
  range.setEnd(endNode.node, Math.max(0, Math.min(endNode.node.textContent.length, end - endNode.start)));
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  startNode.node.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

function MarkdownBoxEditor({ title, value, onChange, previewKind = "document", previewConfig = {}, token, monthSlug, documentKey = "document", actor, sourceRevision = 0, hideHeader = false, mode: controlledMode, onModeChange }) {
  const [localMode, setLocalMode] = useState("review");
  const mode = controlledMode || localMode;
  const setMode = onModeChange || setLocalMode;
  const [uploadState, setUploadState] = useState("");
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [commentSelection, setCommentSelection] = useState(null);
  const [commentState, setCommentState] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionState, setSuggestionState] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const [renderedSelection, setRenderedSelection] = useState(null);
  const [lease, setLease] = useState(null);
  const [leaseState, setLeaseState] = useState("Checking editor access...");
  const [outlineQuery, setOutlineQuery] = useState("");
  const holderSession = useMemo(() => editorSessionId(), []);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const reviewRef = useRef(null);
  const reviewOutline = useMemo(() => markdownReviewOutline(value), [value]);

  useEffect(() => {
    if (mode !== "review") setRenderedSelection(null);
  }, [mode]);

  useEffect(() => {
    if (!token || !monthSlug) return;
    loadComments();
    loadSuggestions();
    const timer = window.setInterval(() => { loadComments(); loadSuggestions(); }, 1500);
    return () => window.clearInterval(timer);
  }, [token, monthSlug, documentKey]);

  useEffect(() => {
    if (!token || !monthSlug || !documentKey || !actor?.id || mode !== "edit") {
      setLease(null);
      return undefined;
    }
    let cancelled = false;
    const syncLease = async () => {
      try {
        const data = await adminFetch(token, "/api/mastery-admin", {
          method: "POST",
          body: JSON.stringify({
            action: "editor-lease",
            operation: "acquire",
            actor,
            month_slug: monthSlug,
            document_key: documentKey,
            holder_session: holderSession,
          }),
        });
        if (cancelled) return;
        setLease(data.lease || null);
        setLeaseState(data.lease?.granted
          ? `You are editing. Lease renews automatically.`
          : `${data.lease?.holder_name || "Another teammate"} is editing. You can still select text and comment.`);
      } catch (err) {
        if (cancelled) return;
        setLease(null);
        setLeaseState(`${err.message || "Editor access could not be checked"}. Direct editing is paused.`);
      }
    };
    syncLease();
    const timer = window.setInterval(syncLease, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "editor-lease",
          operation: "release",
          actor,
          month_slug: monthSlug,
          document_key: documentKey,
          holder_session: holderSession,
        }),
      }).catch(() => {});
    };
  }, [token, monthSlug, documentKey, mode, actor?.id, actor?.name, actor?.email, actor?.avatar, holderSession]);

  const canDirectEdit = mode === "edit" && Boolean(lease?.granted);

  async function loadComments() {
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=comments&slug=${encodeURIComponent(monthSlug)}&document_key=${encodeURIComponent(documentKey)}`);
      setComments(data.comments || []);
      setCommentState("");
    } catch (err) {
      setCommentState(err.message || "Could not load comments");
    }
  }

  async function loadSuggestions() {
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=suggestions&slug=${encodeURIComponent(monthSlug)}&document_key=${encodeURIComponent(documentKey)}`);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setSuggestionState(err.message || "Could not load suggestions");
    }
  }

  function startComment() {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? start;
    const quotedText = String(value || "").slice(start, end);
    if (!quotedText.trim()) {
      setCommentState("Select some text first, then click Comment.");
      return;
    }
    setCommentSelection({ start, end, quotedText });
    setCommentDraft("");
    setCommentState("");
  }

  function currentRenderedSelection() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().replace(/\s+/g, " ").trim() || "";
    if (!selectedText || !reviewRef.current?.contains(selection?.anchorNode)) {
      return null;
    }
    let occurrence = 0;
    try {
      const selectedRange = selection.getRangeAt(0);
      const beforeRange = document.createRange();
      beforeRange.selectNodeContents(reviewRef.current);
      beforeRange.setEnd(selectedRange.startContainer, selectedRange.startOffset);
      const beforeText = beforeRange.toString().replace(/\s+/g, " ");
      occurrence = Math.max(0, beforeText.split(selectedText).length - 1);
    } catch {
      occurrence = 0;
    }
    const mapped = markdownRangeForRenderedText(String(value || ""), selectedText, occurrence);
    if (!mapped) return null;
    return {
      ...mapped,
      anchorContext: {
        occurrence,
        before: String(value || "").slice(Math.max(0, mapped.start - 160), mapped.start),
        after: String(value || "").slice(mapped.end, mapped.end + 160),
      },
    };
  }

  function captureRenderedSelection() {
    const selection = window.getSelection();
    const mapped = currentRenderedSelection();
    if (!mapped || !selection?.rangeCount) {
      setRenderedSelection((current) => current?.mode === "comment" ? current : null);
      return;
    }
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const halfWidth = Math.min(160, Math.max(110, viewportWidth / 2 - 12));
    const left = Math.min(viewportWidth - halfWidth, Math.max(halfWidth, rect.left + rect.width / 2));
    const top = rect.bottom + 230 < viewportHeight ? rect.bottom + 8 : Math.max(12, rect.top - 218);
    setRenderedSelection({ mapped, left, top, mode: "actions" });
  }

  function startRenderedComment(mappedSelection = null, contextual = false) {
    const mapped = mappedSelection?.quotedText ? mappedSelection : currentRenderedSelection();
    if (!mapped) {
      setCommentState("Select one visible sentence or list item first, then click Comment on selection.");
      return;
    }
    setCommentSelection(mapped);
    setCommentDraft("");
    setCommentState("");
    if (contextual) {
      setRenderedSelection((current) => current ? { ...current, mapped, mode: "comment" } : current);
    } else {
      setRenderedSelection(null);
    }
  }

  async function createSuggestion(mappedSelection = null) {
    const mapped = mappedSelection?.quotedText ? mappedSelection : currentRenderedSelection();
    if (!mapped) {
      setSuggestionState("Select one visible sentence or list item first, then click Suggest change.");
      return;
    }
    const rawType = window.prompt("Suggestion type: replacement, insertion, or deletion", "replacement");
    const suggestionType = String(rawType || "").trim().toLowerCase();
    if (!["replacement", "insertion", "deletion"].includes(suggestionType)) return;
    const replacementText = suggestionType === "deletion" ? "" : window.prompt(
      suggestionType === "insertion" ? "Text to insert after the selection" : "Replacement text",
      suggestionType === "replacement" ? mapped.quotedText : ""
    );
    if (suggestionType !== "deletion" && !replacementText?.trim()) return;
    setSuggestionState("Posting suggestion...");
    try {
      await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "create-suggestion", actor, month_slug: monthSlug, document_key: documentKey,
          suggestion_type: suggestionType, selection_start: mapped.start, selection_end: mapped.end,
          quoted_text: mapped.quotedText, replacement_text: replacementText || "",
          anchor_context: mapped.anchorContext, source_revision: sourceRevision,
        }),
      });
      setSuggestionState("Suggestion posted");
      setRenderedSelection(null);
      await loadSuggestions();
    } catch (err) {
      setSuggestionState(err.message || "Could not post suggestion");
    }
  }

  async function decideSuggestion(suggestion, decision) {
    if (decision === "accepted" && !window.confirm("Accept and apply this exact suggestion? A version checkpoint will be created.")) return;
    setSuggestionState(decision === "accepted" ? "Applying suggestion..." : "Rejecting suggestion...");
    try {
      await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "decide-suggestion", actor, suggestion_id: suggestion.id, decision }),
      });
      setSuggestionState(decision === "accepted" ? "Suggestion applied. The shared revision is updating." : "Suggestion rejected");
      await loadSuggestions();
    } catch (err) {
      setSuggestionState(err.message || "Could not decide suggestion");
      await loadSuggestions();
    }
  }

  function jumpToComment(comment) {
    if (!selectRenderedQuote(reviewRef.current, comment.quoted_text, Number(comment.anchor_context?.occurrence) || 0)) {
      setCommentState("This comment needs re-anchoring because the quoted sentence changed.");
    } else {
      setCommentState("");
    }
  }

  function jumpToSuggestion(suggestion) {
    if (!selectRenderedQuote(reviewRef.current, suggestion.quoted_text, Number(suggestion.anchor_context?.occurrence) || 0)) {
      setSuggestionState("This suggestion needs reconciliation because the quoted sentence changed.");
    } else {
      setSuggestionState("");
    }
  }

  async function createComment(parentId = null) {
    const bodyText = parentId ? replyDrafts[parentId] : commentDraft;
    if (!bodyText?.trim()) return;
    setCommentState(parentId ? "Posting reply..." : "Posting comment...");
    try {
      await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "create-comment", actor, month_slug: monthSlug, document_key: documentKey,
          parent_id: parentId, body: bodyText,
          selection_start: commentSelection?.start, selection_end: commentSelection?.end,
          quoted_text: commentSelection?.quotedText,
          anchor_context: commentSelection?.anchorContext,
        }),
      });
      setCommentSelection(null);
      setCommentDraft("");
      if (!parentId) setRenderedSelection(null);
      setReplyDrafts((current) => ({ ...current, [parentId]: "" }));
      await loadComments();
    } catch (err) { setCommentState(err.message || "Could not post comment"); }
  }

  async function editComment(comment) {
    const nextBody = window.prompt("Edit comment", comment.body);
    if (!nextBody || nextBody.trim() === comment.body) return;
    try {
      await adminFetch(token, "/api/mastery-admin", { method: "POST", body: JSON.stringify({ action: "update-comment", actor, comment_id: comment.id, body: nextBody }) });
      await loadComments();
    } catch (err) { setCommentState(err.message || "Could not edit comment"); }
  }

  async function deleteComment(comment) {
    if (!window.confirm("Delete this comment? Replies in its thread will also be deleted.")) return;
    try {
      await adminFetch(token, "/api/mastery-admin", { method: "POST", body: JSON.stringify({ action: "delete-comment", actor, comment_id: comment.id }) });
      await loadComments();
    } catch (err) { setCommentState(err.message || "Could not delete comment"); }
  }

  async function toggleResolved(comment) {
    try {
      await adminFetch(token, "/api/mastery-admin", { method: "POST", body: JSON.stringify({ action: "resolve-comment", actor, comment_id: comment.id, resolved: !comment.resolved_at }) });
      await loadComments();
    } catch (err) { setCommentState(err.message || "Could not update thread"); }
  }

  function insertText(template) {
    if (!canDirectEdit) return;
    const textarea = textareaRef.current;
    const currentValue = value || "";
    if (!textarea) {
      onChange(`${currentValue}${template}`);
      return;
    }

    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? currentValue.length;
    const before = currentValue.slice(0, start);
    const selected = currentValue.slice(start, end);
    const after = currentValue.slice(end);
    const nextText = typeof template === "function" ? template(selected) : template;
    const nextValue = `${before}${nextText}${after}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + nextText.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function wrapSelection(prefix, suffix = prefix) {
    insertText((selected) => `${prefix}${selected || "text"}${suffix}`);
  }

  function addImageUrl() {
    const path = window.prompt("Image URL", "https://example.com/screenshot.png");
    if (!path) return;
    const alt = window.prompt("Alt text", "Screenshot") || "Screenshot";
    insertText(`\n![${alt}](${path})\n\n`);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadScreenshot(file) {
    if (!file) return;
    if (!canDirectEdit) {
      setUploadState("Direct editing is currently held by another teammate.");
      return;
    }
    if (!token) {
      setUploadState("Unlock admin before uploading.");
      return;
    }

    setUploadState("Uploading screenshot...");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "upload-image",
          month_slug: monthSlug || "shared",
          file_name: file.name,
          content_type: file.type,
          data: dataUrl,
        }),
      });
      const suggestedAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const alt = window.prompt("Caption / alt text (optional)", suggestedAlt) || "";
      insertText(`\n![${alt.trim()}](${data.url})\n\n`);
      setMode("review");
      setUploadState("Screenshot inserted");
      window.setTimeout(() => setUploadState(""), 2200);
    } catch (err) {
      setUploadState(err.message || "Upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <article className={`markdown-editor-box${hideHeader ? " markdown-editor-box-embedded" : ""}`}>
      {!hideHeader && (
        <div className="markdown-editor-head">
          <h2>{title}</h2>
          <EditorModeToggle mode={mode} onChange={setMode} />
        </div>
      )}
      {mode === "edit" && (
        <>
        <div className={`editor-lease-banner ${canDirectEdit ? "is-editor" : "is-viewer"}`} role="status">
          <span className="editor-lease-dot" aria-hidden="true" />
          <strong>{canDirectEdit ? "Editing enabled" : "Review mode"}</strong>
          <span>{leaseState}</span>
        </div>
        <div className="notion-editor-toolbar" aria-label={`${title} block controls`} aria-disabled={!canDirectEdit}>
          <div className="notion-editor-groups">
            {MARKDOWN_TOOL_GROUPS.map((group) => (
              <section className="notion-editor-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="notion-editor-row">
                  {group.items.map((block) => (
                    <button type="button" key={block.label} disabled={!canDirectEdit} onClick={() => insertText(block.template)}>
                      {block.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="admin-toolbar-hint">
            Every custom customer element is addable above. Use <strong>Step Card</strong> for numbered guide cards, <strong>Prep Card</strong> for setup checklists, and <strong>Part Break</strong> to group the guide contents.
          </p>
          <details className="markdown-schema-panel">
            <summary>Markdown schema: what becomes what</summary>
            <div className="markdown-schema-grid">
              {MARKDOWN_BLOCKS.map((block) => (
                <div className="markdown-schema-row" key={`${block.label}-${block.syntax}`}>
                  <strong>{block.label}</strong>
                  <code>{block.syntax}</code>
                  <span>{block.preview}</span>
                </div>
              ))}
              <div className="markdown-schema-row">
                <strong>Inline formatting</strong>
                <code>**bold** · *italic* · `code` · [link](url)</code>
                <span>Inline text styling inside most blocks.</span>
              </div>
            </div>
          </details>
          <div className="notion-editor-row notion-editor-row-inline">
            <button type="button" disabled={!canDirectEdit} onClick={() => wrapSelection("**")}>Bold</button>
            <button type="button" disabled={!canDirectEdit} onClick={() => wrapSelection("*")}>Italic</button>
            <button type="button" disabled={!canDirectEdit} onClick={() => wrapSelection("`")}>Code Text</button>
            <button type="button" disabled={!canDirectEdit} onClick={() => insertText((selected) => `[${selected || "Link text"}](https://example.com)`)}>Link</button>
            <input
              ref={fileInputRef}
              className="admin-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => uploadScreenshot(event.target.files?.[0])}
            />
            <button type="button" disabled={!canDirectEdit} onClick={() => fileInputRef.current?.click()}>Upload Screenshot</button>
            <button type="button" disabled={!canDirectEdit} onClick={addImageUrl}>Image URL</button>
            {hasSelection && <button type="button" className="comment-button" onClick={startComment}>Comment on selection</button>}
          </div>
          {uploadState && <p className="admin-upload-status">{uploadState}</p>}
        </div>
        </>
      )}
      {mode === "edit" ? (
        <div className="markdown-collaboration-layout">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => canDirectEdit && onChange(event.target.value)}
            onSelect={(event) => setHasSelection(event.currentTarget.selectionEnd > event.currentTarget.selectionStart)}
            readOnly={!canDirectEdit}
            rows={24}
            spellCheck="true"
          />
          <aside className="editor-comments" aria-label={`${title} comments`}>
            <div className="editor-comments-head"><strong>Comments</strong><span>{comments.filter((item) => !item.parent_id && !item.resolved_at).length} open</span></div>
            {commentSelection && (
              <div className="comment-composer">
                <blockquote>{commentSelection.quotedText}</blockquote>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} autoFocus placeholder="Leave a comment..." />
                <div><button type="button" onClick={() => createComment()}>Comment</button><button type="button" onClick={() => setCommentSelection(null)}>Cancel</button></div>
              </div>
            )}
            {comments.filter((item) => !item.parent_id).map((comment) => {
              const replies = comments.filter((item) => item.parent_id === comment.id);
              const isCreator = comment.author_id === actor?.id;
              return <article className={`comment-thread ${comment.resolved_at ? "resolved" : ""}`} key={comment.id}>
                <blockquote>{comment.quoted_text}</blockquote>
                <div className="comment-meta"><span className="comment-author">{comment.author_avatar && <img src={comment.author_avatar} alt="" />}<strong>{comment.author_name}</strong></span><time>{new Date(comment.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>
                <p>{comment.body}</p>
                {replies.map((reply) => <div className="comment-reply" key={reply.id}>
                  <div className="comment-meta"><span className="comment-author">{reply.author_avatar && <img src={reply.author_avatar} alt="" />}<strong>{reply.author_name}</strong></span><time>{new Date(reply.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>
                  <p>{reply.body}</p>
                  {reply.author_id === actor?.id && <div className="comment-actions"><button type="button" onClick={() => editComment(reply)}>Edit</button><button type="button" onClick={() => deleteComment(reply)}>Delete</button></div>}
                </div>)}
                {!comment.resolved_at && <textarea value={replyDrafts[comment.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))} rows={2} placeholder="Reply..." />}
                <div className="comment-actions">
                  {!comment.resolved_at && replyDrafts[comment.id]?.trim() && <button type="button" onClick={() => createComment(comment.id)}>Reply</button>}
                  <button type="button" onClick={() => toggleResolved(comment)}>{comment.resolved_at ? "Reopen" : "Resolve"}</button>
                  {isCreator && <><button type="button" onClick={() => editComment(comment)}>Edit</button><button type="button" onClick={() => deleteComment(comment)}>Delete</button></>}
                </div>
              </article>;
            })}
            {!comments.length && !commentSelection && <p className="admin-preview-empty">Select text and click Comment to start a discussion.</p>}
            {commentState && <p className="admin-upload-status">{commentState}</p>}
          </aside>
        </div>
      ) : (
        <div className="review-workspace">
          <aside className="review-outline" aria-label={`${title} sections`}>
            <div className="review-outline-head">
              <strong>Sections</strong>
              <span>{reviewOutline.length}</span>
            </div>
            <input
              type="search"
              value={outlineQuery}
              onChange={(event) => setOutlineQuery(event.target.value)}
              placeholder="Find a section..."
              aria-label="Find a section"
            />
            <nav>
              {reviewOutline.filter((item) => item.title.toLowerCase().includes(outlineQuery.toLowerCase())).map((item, index) => (
                <button
                  type="button"
                  className={`review-outline-level-${item.level}`}
                  key={`${item.id}-${index}`}
                  onClick={() => reviewRef.current?.querySelector(`#${CSS.escape(item.id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </aside>
          <div
            className="markdown-editor-preview review-rendered"
            ref={reviewRef}
            onMouseUp={captureRenderedSelection}
            onKeyUp={captureRenderedSelection}
            onTouchEnd={captureRenderedSelection}
          >
            <div className="review-selection-bar">
              <span>Select visible text to discuss it.</span>
              <div>
                <button type="button" onClick={() => startRenderedComment()}>Comment</button>
                <button type="button" onClick={() => createSuggestion()}>Suggest change</button>
              </div>
            </div>
            <MarkdownPreviewErrorBoundary
              resetKey={`${previewKind}:${monthSlug}:${value}`}
              fallback={<CustomerMarkdownFallback content={value} kind={previewKind} />}
            >
              <CustomerMarkdownPreview content={value} kind={previewKind} monthSlug={monthSlug} previewConfig={previewConfig} />
            </MarkdownPreviewErrorBoundary>
            {renderedSelection && (
              <div
                className={`review-selection-popover${renderedSelection.mode === "comment" ? " is-composing" : ""}`}
                style={{ left: `${renderedSelection.left}px`, top: `${renderedSelection.top}px` }}
                role={renderedSelection.mode === "comment" ? "dialog" : "toolbar"}
                aria-label={renderedSelection.mode === "comment" ? "Add comment to selected text" : "Selected text actions"}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  if (renderedSelection.mode === "actions") event.preventDefault();
                }}
                onMouseUp={(event) => event.stopPropagation()}
                onKeyUp={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                {renderedSelection.mode === "comment" ? (
                  <div className="review-selection-composer">
                    <blockquote>{renderedSelection.mapped.quotedText}</blockquote>
                    <textarea
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="Leave a comment..."
                      aria-label="Comment"
                    />
                    <div>
                      <button type="button" disabled={!commentDraft.trim()} onClick={() => createComment()}>Add comment</button>
                      <button type="button" onClick={() => { setCommentSelection(null); setCommentDraft(""); setRenderedSelection(null); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => startRenderedComment(renderedSelection.mapped, true)}>Comment</button>
                    <button type="button" onClick={() => createSuggestion(renderedSelection.mapped)}>Suggest</button>
                  </>
                )}
              </div>
            )}
          </div>
          <ReviewCommentRail
            comments={comments}
            actor={actor}
            commentSelection={commentSelection}
            commentDraft={commentDraft}
            setCommentDraft={setCommentDraft}
            setCommentSelection={setCommentSelection}
            replyDrafts={replyDrafts}
            setReplyDrafts={setReplyDrafts}
            commentState={commentState}
            createComment={createComment}
            editComment={editComment}
            deleteComment={deleteComment}
            toggleResolved={toggleResolved}
            jumpToComment={jumpToComment}
            suggestions={suggestions}
            suggestionState={suggestionState}
            decideSuggestion={decideSuggestion}
            jumpToSuggestion={jumpToSuggestion}
            suppressComposer={renderedSelection?.mode === "comment"}
          />
        </div>
      )}
    </article>
  );
}

function ReviewCommentRail({ comments, actor, commentSelection, commentDraft, setCommentDraft, setCommentSelection, replyDrafts, setReplyDrafts, commentState, createComment, editComment, deleteComment, toggleResolved, jumpToComment, suggestions, suggestionState, decideSuggestion, jumpToSuggestion, suppressComposer = false }) {
  const threads = comments.filter((item) => !item.parent_id);
  return (
    <aside className="editor-comments review-comments" aria-label="Rendered guide comments">
      <div className="editor-comments-head">
        <strong>Comments</strong>
        <span>{threads.filter((item) => !item.resolved_at).length} open</span>
      </div>
      {commentSelection && !suppressComposer && (
        <div className="comment-composer">
          <blockquote>{commentSelection.quotedText}</blockquote>
          <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} autoFocus placeholder="Leave a comment..." />
          <div>
            <button type="button" onClick={() => createComment()}>Comment</button>
            <button type="button" onClick={() => setCommentSelection(null)}>Cancel</button>
          </div>
        </div>
      )}
      {threads.map((comment) => {
        const replies = comments.filter((item) => item.parent_id === comment.id);
        const isCreator = comment.author_id === actor?.id;
        return (
          <article className={`comment-thread ${comment.resolved_at ? "resolved" : ""}`} key={comment.id}>
            <button type="button" className="comment-anchor-button" onClick={() => jumpToComment(comment)}>
              <blockquote>{comment.quoted_text}</blockquote>
              <span>Jump to sentence</span>
            </button>
            <div className="comment-meta">
              <span className="comment-author">{comment.author_avatar && <img src={comment.author_avatar} alt="" />}<strong>{comment.author_name}</strong></span>
              <time>{new Date(comment.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
            </div>
            <p>{comment.body}</p>
            {replies.map((reply) => (
              <div className="comment-reply" key={reply.id}>
                <div className="comment-meta">
                  <span className="comment-author">{reply.author_avatar && <img src={reply.author_avatar} alt="" />}<strong>{reply.author_name}</strong></span>
                  <time>{new Date(reply.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                <p>{reply.body}</p>
                {reply.author_id === actor?.id && <div className="comment-actions"><button type="button" onClick={() => editComment(reply)}>Edit</button><button type="button" onClick={() => deleteComment(reply)}>Delete</button></div>}
              </div>
            ))}
            {!comment.resolved_at && <textarea value={replyDrafts[comment.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))} rows={2} placeholder="Reply..." />}
            <div className="comment-actions">
              {!comment.resolved_at && replyDrafts[comment.id]?.trim() && <button type="button" onClick={() => createComment(comment.id)}>Reply</button>}
              <button type="button" onClick={() => toggleResolved(comment)}>{comment.resolved_at ? "Reopen" : "Resolve"}</button>
              {isCreator && <><button type="button" onClick={() => editComment(comment)}>Edit</button><button type="button" onClick={() => deleteComment(comment)}>Delete</button></>}
            </div>
          </article>
        );
      })}
      {!threads.length && !commentSelection && <p className="admin-preview-empty">Select a sentence in the guide to start a discussion.</p>}
      {commentState && <p className="admin-upload-status">{commentState}</p>}
      <div className="review-suggestions-head">
        <strong>Suggestions</strong>
        <span>{suggestions.filter((item) => item.status === "pending").length} pending</span>
      </div>
      {suggestions.map((suggestion) => (
        <article className={`suggestion-card suggestion-${suggestion.status}`} key={suggestion.id}>
          <button type="button" className="comment-anchor-button" onClick={() => jumpToSuggestion(suggestion)}>
            <blockquote>{suggestion.quoted_text}</blockquote>
            <span>Jump to sentence</span>
          </button>
          <div className="suggestion-change">
            <span>{suggestion.suggestion_type}</span>
            {suggestion.suggestion_type !== "deletion" && <p>{suggestion.replacement_text}</p>}
          </div>
          <div className="comment-meta"><strong>{suggestion.proposer_name}</strong><span>{suggestion.status}</span></div>
          {suggestion.status === "pending" && (
            <div className="comment-actions">
              <button type="button" onClick={() => decideSuggestion(suggestion, "accepted")}>Accept</button>
              <button type="button" onClick={() => decideSuggestion(suggestion, "rejected")}>Reject</button>
            </div>
          )}
        </article>
      ))}
      {!suggestions.length && <p className="admin-preview-empty">Select visible text and click Suggest change.</p>}
      {suggestionState && <p className="admin-upload-status">{suggestionState}</p>}
    </aside>
  );
}

class MarkdownPreviewErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="admin-preview-error" role="alert">
          <strong>Preview could not render this block.</strong>
          <p>Check the newest Markdown line, especially image URLs and brackets. The editor content is still saved.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CustomerMarkdownFallback({ content, kind = "document" }) {
  if (kind === "guide") return <GenericGuideCards content={content} />;
  if (kind === "challenge") return <ChallengeCustomerPreview content={content} />;
  return <MarkdownBlocks blocks={blocksWithHeadingIds(content)} />;
}

function CustomerMarkdownPreview({ content, kind, monthSlug = "", previewConfig = {} }) {
  if (!content?.trim()) return <p className="admin-preview-empty">Nothing written yet.</p>;
  if (kind === "guide") return <GuideCustomerPreview content={content} monthSlug={monthSlug} tocConfig={previewConfig} />;
  if (kind === "challenge") return <ChallengeCustomerPreview content={content} />;
  return <MarkdownBlocks blocks={blocksWithHeadingIds(content)} />;
}

function GuideCustomerPreview({ content, monthSlug = "", tocConfig = {} }) {
  const guide = useMemo(() => getGuideModel(content), [content]);
  const navigation = useMemo(() => guideTocDraft(guide, tocConfig), [guide, tocConfig]);

  if (!guide.introSections.length && !guide.steps.length && !guide.closingSections.length) {
    return <GenericGuideCards content={content} />;
  }

  return (
    <div className="admin-customer-preview">
      <div className="admin-guide-toc-preview">
        <span>{navigation.title}</span>
        {navigation.groups.map((group) => (
          <div key={group.key}>
            <strong>{group.title}</strong>
            <p>{navigation.items.filter((item) => item.group === group.key).map((item) => item.label).join(" · ")}</p>
          </div>
        ))}
      </div>
      <div className="workbench-layout">
        <div className="workbench-stack">
          {guide.introSections.map((section) => (
            <IntroCustomerPreview section={section} monthSlug={monthSlug} key={section.title} />
          ))}
          {guide.steps.map((step, index) => {
            const leadBlocks = stepLeadBlocks(step);
            const bodyBlocks = stepBodyBlocks(step);
            return (
              <article className="workbench-step" id={step.id} key={step.id}>
                <div className="workbench-step-top">
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <AdminStepHelpActions />
                </div>
                {leadBlocks.length > 0 && <MarkdownBlocks blocks={leadBlocks} />}
                {step.explainer && <p className="workbench-step-explainer">{step.explainer}</p>}
                <h3>{step.title}</h3>
                {!step.explainer && step.summary && <p className="workbench-step-subtitle">{step.summary}</p>}
                <MarkdownBlocks blocks={bodyBlocks} />
              </article>
            );
          })}
          {guide.closingSections.map((section) => (
            <article className="workbench-step workbench-close" id={section.id} key={section.title}>
              <div className="workbench-step-top">
                <span>{section.title.includes("Bonus") ? "Bonus" : "Finish"}</span>
              </div>
              <h3>{section.title}</h3>
              <MarkdownBlocks blocks={section.blocks} />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntroCustomerPreview({ section, monthSlug = "" }) {
  const isBeforeStart = section.title === "Before You Start";
  const dynamicPrep = isBeforeStart ? prepChecklistFromBlocks(section.blocks) : { items: [], notes: [], experience: "" };
  const checklistItems = dynamicPrep.items;

  if (isBeforeStart && checklistItems.length) {
    return (
      <article className="workbench-step workbench-intro before-start-card" id={section.id}>
        <div className="workbench-step-top">
          <span>Prep checklist</span>
        </div>
        <div className="before-start-layout">
          <div>
            <h3>{section.title}</h3>
            <p className="workbench-step-subtitle">
              Get these setup pieces ready before you start the guide.
            </p>
          </div>
        </div>
        <BeforeStartChecklist items={checklistItems} />
        {dynamicPrep.notes.map((note) => (
          <MarkdownNote text={`Note: ${note}`} key={note} />
        ))}
        {dynamicPrep.experience && <PrepExperienceBox>{dynamicPrep.experience}</PrepExperienceBox>}
      </article>
    );
  }

  return (
    <article className="workbench-step workbench-intro" id={section.id}>
      <div className="workbench-step-top">
        <span>{isBeforeStart ? "Prep checklist" : "Prep"}</span>
      </div>
      <h3>{section.title}</h3>
      <MarkdownBlocks blocks={section.blocks} />
    </article>
  );
}

function BeforeStartChecklist({ items = [] }) {
  return (
    <div className="before-start-checklist">
      {items.map((item) => (
        <div className="before-start-item" key={item.label}>
          <span className="before-start-check" aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            {item.detail && <p>{item.detail}</p>}
            {item.link && (
              <a className="link-button" href={item.link} target={item.link.startsWith("/") ? undefined : "_blank"} rel={item.link.startsWith("/") ? undefined : "noreferrer"}>
                {item.linkLabel || "Open"}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrepExperienceBox({ children }) {
  return (
    <aside className="prep-experience-box">
      <span>Previous experience required</span>
      <p>{renderInlineMarkdown(children)}</p>
    </aside>
  );
}

function ChallengeCustomerPreview({ content }) {
  const sections = useMemo(() => groupedMarkdownSections(content), [content]);

  return (
    <div className="admin-customer-preview">
      <div className="workbench-layout challenge-workbench-layout">
        <div className="workbench-stack">
          {sections.map((section, index) => {
            const heading = section.blocks[0];
            const title = section.title;
            const blocks = heading?.text === title ? section.blocks.slice(1) : section.blocks;
            return (
              <article className="workbench-step challenge-guide-card" id={heading?.id || sectionId(title)} key={`${title}-${index}`}>
                <div className="workbench-step-top">
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <AdminStepHelpActions />
                </div>
                <h3>{renderInlineMarkdown(title)}</h3>
                <MarkdownBlocks blocks={blocks} />
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GenericGuideCards({ content }) {
  const sections = useMemo(() => groupedMarkdownSections(content), [content]);
  return (
    <div className="admin-customer-preview">
      <div className="workbench-layout">
        <div className="workbench-stack">
          {sections.map((section, index) => (
            <article className="workbench-step" id={section.blocks[0]?.id || sectionId(section.title)} key={`${section.title}-${index}`}>
              <div className="workbench-step-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
              </div>
              <MarkdownBlocks blocks={section.blocks} />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminStepHelpActions() {
  return (
    <div className="step-help-actions admin-preview-help" aria-label="Customer help buttons preview">
      <button type="button" disabled>Ask AI</button>
      <button type="button" disabled>Ask mods</button>
    </div>
  );
}

function getGuideModel(content) {
  const sections = splitGuideSections(content);
  const closingTitles = new Set([
    "🏆 Bonus: Generate Your Certificate",
    "🎨 Bonus: Your Own AI Image Studio",
    "Safety & Security Fixes",
    "Next Steps",
  ]);
  const steps = [];
  let tocGroupKey = "workshop";
  let tocGroupTitle = "Workshop";
  const firstStepIndex = sections.findIndex((section) => section.title.startsWith("Step "));
  const lastStepIndex = sections.findLastIndex((section) => section.title.startsWith("Step "));
  const introSections = sections.filter((section, index) => {
    if (firstStepIndex === -1 || index >= firstStepIndex) return false;
    if (section.title.startsWith("PART ")) return false;
    return !closingTitles.has(section.title);
  });
  const closingSections = sections
    .filter((section, index) => {
      if (closingTitles.has(section.title)) return true;
      if (lastStepIndex === -1 || index <= lastStepIndex) return false;
      return !section.title.startsWith("PART ");
    })
    .map((section) => ({ ...section }));

  sections.forEach((section) => {
    const partMatch = section.title.match(/^PART\s+(\d+)\s*[:.-]\s*(.+)$/i);
    if (partMatch) {
      tocGroupKey = `part-${partMatch[1]}`;
      tocGroupTitle = `${partMatch[1]} · ${toTitleCase(partMatch[2])}`;
    }
    if (section.title.startsWith("Step ")) {
      steps.push({
        ...section,
        tocGroupKey,
        tocGroupTitle,
        stepNumber: steps.length + 1,
        shortTitle: section.title.replace(/^Step \d+:\s*/, ""),
        summary: blocksToPlainText(stepBodyBlocks(section).slice(0, 1)).replace(/\s+/g, " ").trim(),
        explainer: "",
      });
    }
  });

  return {
    introSections,
    steps,
    closingSections,
  };
}

function guideTocDraft(guide) {
  const baseItems = [
    ...guide.introSections.map((section, index) => ({
      key: `intro-${index}`,
      marker: index === 0 ? "Start" : "Prep",
      label: adminGuideTocLabel(section.title),
      sourceLabel: section.title,
      group: "start-here",
      groupTitle: "Start Here",
    })),
    ...guide.steps.map((step) => ({
      key: `step-${step.stepNumber}`,
      marker: String(step.stepNumber).padStart(2, "0"),
      label: adminGuideTocLabel(step.shortTitle),
      sourceLabel: step.shortTitle,
      group: step.tocGroupKey,
      groupTitle: step.tocGroupTitle,
    })),
    ...guide.closingSections.map((section, index) => ({
      key: `closing-${index}`,
      marker: "End",
      label: adminGuideTocLabel(section.title),
      sourceLabel: section.title,
      group: "finish",
      groupTitle: "Finish",
    })),
  ];
  const groups = [];
  const groupKeys = new Set();

  const items = baseItems.map((item) => {
    const group = item.group;
    if (!groupKeys.has(group)) {
      groups.push({ key: group, title: item.groupTitle || "Guide" });
      groupKeys.add(group);
    }
    return { ...item, group };
  });

  return { title: "Guide contents", groups, items };
}

function adminGuideTocLabel(label = "") {
  return label;
}

function toTitleCase(value = "") {
  const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "the", "to", "with"]);
  return value.trim().toLowerCase().split(/\s+/).map((word, index) => (
    index > 0 && smallWords.has(word) ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
  )).join(" ");
}

function splitGuideSections(content) {
  const blocks = buildMarkdownBlocks(content);
  const sections = [];
  let current = null;
  let pendingLeadBlocks = [];

  blocks.forEach((block) => {
    if (isGuideCardLeadIn(block) && !isGuideStepTitle(current?.title)) {
      pendingLeadBlocks = [block];
      return;
    }

    if (pendingLeadBlocks.length && !isGuideSectionBreak(block)) {
      if (block.type !== "rule" && block.type !== "space") pendingLeadBlocks.push(block);
      return;
    }

    if (isGuideSectionBreak(block)) {
      const leadBlocks = isGuideStepTitle(block.text) ? pendingLeadBlocks : [];
      current = {
        id: sectionId(block.text),
        title: block.text,
        blocks: leadBlocks,
        leadBlockCount: leadBlocks.length,
      };
      pendingLeadBlocks = [];
      sections.push(current);
      return;
    }

    if (current && block.type !== "rule" && block.type !== "space") {
      current.blocks.push(block);
    }
  });

  if (pendingLeadBlocks.length && current) current.blocks.push(...pendingLeadBlocks);

  return sections.filter((section) => section.blocks.length || section.title.startsWith("Step "));
}

function isGuideSectionBreak(block) {
  if (!block?.text || block.text === "Table of Contents") return false;
  if (block.type === "h4") return true;
  return block.type === "h3" && /^PART\s+\d+\s*[:.-]/i.test(block.text);
}

function isGuideCardLeadIn(block) {
  return block?.type === "h5" && /^PART\s+\d+\s*[:.-]/i.test(block.text || "");
}

function isGuideStepTitle(title = "") {
  return /^Step\s+\d+\s*[:.-]/i.test(title);
}

function stepLeadBlocks(step = {}) {
  const count = step.leadBlockCount || 0;
  return count ? (step.blocks || []).slice(0, count) : [];
}

function stepBodyBlocks(step = {}) {
  const count = step.leadBlockCount || 0;
  return count ? (step.blocks || []).slice(count) : (step.blocks || []);
}

function groupedMarkdownSections(content) {
  const blocks = blocksWithHeadingIds(content);
  const sections = [];
  let current = null;

  blocks.forEach((block) => {
    if (block.type === "h3" || block.type === "h4" || isChallengeStepHeading(block)) {
      current = {
        title: block.text,
        blocks: [block],
      };
      sections.push(current);
      return;
    }

    if (!current) {
      current = {
        title: "Intro",
        blocks: [],
      };
      sections.push(current);
    }

    current.blocks.push(block);
  });

  return sections.filter((section) => section.blocks.some((block) => block.type !== "space"));
}

function blocksWithHeadingIds(content) {
  const seen = new Map();

  return buildMarkdownBlocks(content).map((block) => {
    if (block.type !== "h3" && block.type !== "h4" && block.type !== "h5") return block;
    const baseId = sectionId(block.text);
    const nextCount = (seen.get(baseId) || 0) + 1;
    seen.set(baseId, nextCount);
    return {
      ...block,
      id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
    };
  });
}

function isChallengeStepHeading(block) {
  return block.type === "h5" && /^Step\s+\d+\s*[-:–]/i.test(block.text || "");
}

function sectionId(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildMarkdownBlocks(content = "") {
  const blocks = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i].replace(/^\t+/, "");
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "space" });
      continue;
    }

    if (trimmed === "## Table of Contents") continue;

    if (trimmed.startsWith("```")) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i].replace(/^\t+/, ""));
        i += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n").trimEnd() });
      continue;
    }

    const image = parseMarkdownImageLine(trimmed);
    if (image) {
      blocks.push(image);
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: "rule" });
      continue;
    }

    const copyPromptMatch = trimmed.match(/^\[\[copy-prompt:([A-Za-z0-9]+)\]\]$/);
    if (copyPromptMatch) {
      blocks.push({ type: "copy-prompt", prompt: copyPromptMatch[1] });
      continue;
    }

    if (trimmed === "[[copy-challenge-prompt]]") {
      blocks.push({ type: "copy-challenge-prompt" });
      continue;
    }

    if (trimmed.startsWith("### ")) blocks.push({ type: "h5", text: trimmed.replace(/^### /, "") });
    else if (trimmed.startsWith("## ")) blocks.push({ type: "h4", text: trimmed.replace(/^## /, "") });
    else if (trimmed.startsWith("# ")) blocks.push({ type: "h3", text: trimmed.replace(/^# /, "") });
    else if (trimmed.startsWith("> ")) blocks.push({ type: "quote", text: trimmed.replace(/^> /, "") });
    else if (trimmed.startsWith("- [ ] ")) blocks.push({ type: "check", text: trimmed.replace("- [ ] ", "") });
    else if (trimmed.startsWith("- ")) blocks.push({ type: "bullet", text: trimmed.replace("- ", "") });
    else if (/^\d+\./.test(trimmed)) blocks.push({ type: "step", text: trimmed });
    else blocks.push({ type: "paragraph", text: trimmed });
  }

  return blocks.filter((block, index, allBlocks) => {
    if (block.type !== "space") return true;
    return index > 0 && index < allBlocks.length - 1 && allBlocks[index - 1].type !== "space";
  });
}

function parseMarkdownImageLine(line = "") {
  const match = line.match(/^!\[([^\]]*)\]\((.*)\)$/);
  if (!match) return null;
  return {
    type: "image",
    alt: match[1] || "",
    src: cleanMarkdownImageSrc(match[2]),
  };
}

function cleanMarkdownImageSrc(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if ((raw.startsWith("<") && raw.endsWith(">")) || (raw.startsWith("\"") && raw.endsWith("\""))) {
    return raw.slice(1, -1).trim();
  }
  const titleMatch = raw.match(/^(\S+)\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/);
  return (titleMatch ? titleMatch[1] : raw).trim();
}

function MarkdownBlocks({ blocks }) {
  return (
    <div className="markdown-document markdown-document-embedded">
      {blocks.map((block, index) => (
        <MarkdownBlockErrorBoundary block={block} key={`${index}-${block.type}-${block.text?.slice(0, 12) || block.src?.slice(0, 12) || ""}`}>
          <MarkdownBlock block={block} />
        </MarkdownBlockErrorBoundary>
      ))}
    </div>
  );
}

class MarkdownBlockErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const block = this.props.block || {};
      return (
        <div className="admin-preview-error" role="alert">
          <strong>Preview skipped one Markdown block.</strong>
          <p>{block.type === "image" ? "The image line is malformed or unavailable." : "This line could not be rendered. The editor content is still saved."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function MarkdownHeading({ block }) {
  const Tag = block.type;
  return <Tag id={block.id} className={isGuideCardLeadIn(block) ? "md-part-heading" : undefined}>{renderInlineMarkdown(block.text)}</Tag>;
}

function MarkdownBlock({ block }) {
  if (block.type === "space") return <div className="md-space" />;
  if (block.type === "rule") return <hr className="md-rule" />;
  if (block.type === "code") return <AdminCopyableCodeBlock text={block.text} />;
  if (block.type === "image") {
    return <MarkdownImageFigure block={block} />;
  }
  if (block.type === "copy-prompt") return <AdminCopyPromptButton promptNumber={block.prompt} />;
  if (block.type === "copy-challenge-prompt") return <AdminChallengePromptButton />;
  if (block.type === "h3" || block.type === "h4" || block.type === "h5") return <MarkdownHeading block={block} />;
  if (["paragraph", "quote"].includes(block.type) && isWarningBlock(block.text)) return <MarkdownWarning text={block.text} />;
  if (["paragraph", "quote"].includes(block.type) && isWinBlock(block.text)) return <MarkdownWin text={block.text} />;
  if (["paragraph", "quote"].includes(block.type) && isLearningBlock(block.text)) return <MarkdownLearning text={block.text} />;
  if (["paragraph", "quote"].includes(block.type) && isIgorNoteBlock(block.text)) return <MarkdownIgorNote text={block.text} />;
  if (block.type === "quote" && isNoteBlock(block.text)) return <MarkdownNote text={block.text} />;
  if (block.type === "paragraph" && isNoteBlock(block.text)) return <MarkdownNote text={block.text} />;
  if (block.type === "quote") return <blockquote className="md-quote">{renderInlineMarkdown(block.text)}</blockquote>;
  if (block.type === "check") return <p className="md-check">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "bullet") return <p className="md-bullet">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "step") return <p className="md-step">{renderInlineMarkdown(block.text)}</p>;
  return <p>{renderInlineMarkdown(block.text)}</p>;
}

function MarkdownImageFigure({ block }) {
  const [failed, setFailed] = useState(false);
  const src = cleanMarkdownImageSrc(block.src);
  const alt = block.alt || "";
  const imageAlt = alt || "Screenshot";
  const isRenderable = /^(https?:\/\/|\/)/i.test(src);
  const figureClassName = [
    "md-figure",
    src === "/july/ch7-18.png" ? "md-figure-compact-phone" : "",
  ].filter(Boolean).join(" ");

  return (
    <figure className={figureClassName}>
      {isRenderable && !failed ? (
        <a href={src} target="_blank" rel="noreferrer" className="md-image-link">
          <img className="md-image" src={src} alt={imageAlt} loading="lazy" onError={() => setFailed(true)} />
        </a>
      ) : (
        <div className="md-image-fallback">
          <strong>Screenshot preview unavailable</strong>
          <span>{src || "Missing image URL"}</span>
        </div>
      )}
      {shouldShowImageCaption(alt) && <figcaption>{alt}</figcaption>}
    </figure>
  );
}

function shouldShowImageCaption(value = "") {
  const caption = String(value || "").trim();
  return Boolean(caption && !/^(screenshot|image)$/i.test(caption));
}

function isWarningBlock(text = "") {
  const trimmed = text.trim();
  return trimmed.startsWith("🛟") || /^heads up:/i.test(trimmed) || /^warning:/i.test(trimmed);
}

function warningText(text = "") {
  return text
    .trim()
    .replace(/^🛟\s*/, "")
    .replace(/^(\*\*)?\s*(heads up|warning)\s*:?\s*(\*\*)?\s*:?\s*/i, "")
    .trim();
}

function isLearningBlock(text = "") {
  const trimmed = text.trim();
  return trimmed.startsWith("💡") || /^lightbulb:/i.test(trimmed) || /^learning moment:/i.test(trimmed);
}

function learningText(text = "") {
  return text
    .trim()
    .replace(/^💡\s*/, "")
    .replace(/^(lightbulb|learning moment):\s*/i, "")
    .trim();
}

function isWinBlock(text = "") {
  const trimmed = text.trim();
  return trimmed.startsWith("🏆") && /\b(big win|your win)\b/i.test(trimmed);
}

function winText(text = "") {
  return text
    .trim()
    .replace(/^🏆\s*/, "")
    .replace(/^(\*\*)?\s*(big win|your win)\s*:?\s*(\*\*)?\s*:?\s*/i, "")
    .trim();
}

function isIgorNoteBlock(text = "") {
  const trimmed = text.trim();
  return trimmed.startsWith("📝") && /igor'?s note/i.test(trimmed);
}

function igorNoteText(text = "") {
  return text
    .trim()
    .replace(/^📝\s*/, "")
    .replace(/^(\*\*)?\s*igor'?s note\s*:?\s*(\*\*)?\s*:?\s*/i, "")
    .trim();
}

function MarkdownLearning({ text }) {
  return (
    <aside className="md-learning-callout">
      <strong>🤔 Learning Moment</strong>
      <p>{renderInlineMarkdown(learningText(text))}</p>
    </aside>
  );
}

function MarkdownWin({ text }) {
  return (
    <aside className="md-win-callout">
      <div className="md-win-medallion" aria-hidden="true">🏆</div>
      <div className="md-win-copy">
        <strong>Your Win</strong>
        <p>{renderInlineMarkdown(winText(text))}</p>
      </div>
    </aside>
  );
}

function MarkdownWarning({ text }) {
  return (
    <aside className="md-warning-callout">
      <strong>Heads up</strong>
      <p>{renderInlineMarkdown(warningText(text))}</p>
    </aside>
  );
}

function MarkdownIgorNote({ text }) {
  return (
    <aside className="md-igor-note">
      <img src="/guide-assets/igor-note.jpg" alt="" loading="lazy" />
      <div>
        <strong>Igor's Note</strong>
        <p>{renderInlineMarkdown(igorNoteText(text))}</p>
      </div>
    </aside>
  );
}

function isNoteBlock(text = "") {
  return /^[📌💡]?\s*(\*\*)?note(\*\*)?:/i.test(text.trim());
}

function noteText(text = "") {
  return text
    .trim()
    .replace(/^[📌💡]\s*/, "")
    .replace(/^(\*\*)?note(\*\*)?:\s*/i, "")
    .trim();
}

function MarkdownNote({ text }) {
  return (
    <aside className="md-note">
      <strong>Note from Igor</strong>
      <p>{renderInlineMarkdown(noteText(text))}</p>
    </aside>
  );
}

function AdminCopyableCodeBlock({ text }) {
  return (
    <div className="md-code-wrap">
      <div className="md-code-actions">
        <span>Prompt</span>
        <button type="button" disabled>Copy prompt</button>
      </div>
      <pre className="md-code">{text}</pre>
    </div>
  );
}

function AdminCopyPromptButton({ promptNumber }) {
  return (
    <button type="button" className="guide-copy-prompt admin-preview-copy" disabled>
      Copy Prompt {promptNumber}
    </button>
  );
}

function AdminChallengePromptButton() {
  return (
    <button type="button" className="guide-copy-prompt admin-preview-copy" disabled>
      Copy challenge prompt
    </button>
  );
}

function renderInlineMarkdown(text = "") {
  const nodes = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={`${match.index}-link`} href={link[2]} target="_blank" rel="noreferrer">
            {link[1].replace(/\*\*/g, "")}
          </a>
        );
      }
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function PromptEditor({ prompts, updatePrompt, addPrompt, removePrompt, token, monthSlug }) {
  return (
    <div className="admin-stack">
      <div className="admin-section-actions">
        <h2>Prompt boxes</h2>
        <button type="button" onClick={addPrompt}>Add Prompt</button>
      </div>
      {prompts.map((prompt, index) => (
        <article className="admin-card" key={`${prompt.title}-${index}`}>
          <div className="admin-section-actions">
            <label>Prompt title<input value={prompt.title || ""} onChange={(event) => updatePrompt(index, "title", event.target.value)} /></label>
            <button type="button" className="danger" onClick={() => removePrompt(index)}>Remove</button>
          </div>
          <MarkdownBoxEditor
            title="Prompt text"
            value={prompt.text || ""}
            onChange={(value) => updatePrompt(index, "text", value)}
            token={token}
            monthSlug={monthSlug}
          />
        </article>
      ))}
    </div>
  );
}

function ExtrasEditor({
  extras,
  adminNotes,
  updateExtras,
  updateAdminNotes,
  updateExtraPrompt,
  addExtraPrompt,
  removeExtraPrompt,
  token,
  monthSlug,
}) {
  const video = extras.video || {};
  return (
    <div className="admin-stack">
      <div className="admin-card">
        <h2>Follow-up video</h2>
        <label>Eyebrow<input value={video.eyebrow || ""} onChange={(event) => updateExtras({ video: { ...video, eyebrow: event.target.value } })} /></label>
        <label>Title<input value={video.title || ""} onChange={(event) => updateExtras({ video: { ...video, title: event.target.value } })} /></label>
        <label>Intro<textarea value={video.intro || ""} onChange={(event) => updateExtras({ video: { ...video, intro: event.target.value } })} rows={3} /></label>
        <label>Vimeo embed URL<input value={video.src || ""} onChange={(event) => updateExtras({ video: { ...video, src: event.target.value, ariaLabel: video.ariaLabel || event.target.value } })} /></label>
      </div>

      <div className="admin-section-actions">
        <h2>Extra prompt boxes</h2>
        <button type="button" onClick={addExtraPrompt}>Add Extra</button>
      </div>
      {(extras.prompts || []).map((prompt, index) => (
        <article className="admin-card" key={`${prompt.title}-${index}`}>
          <div className="admin-section-actions">
            <label>Extra title<input value={prompt.title || ""} onChange={(event) => updateExtraPrompt(index, "title", event.target.value)} /></label>
            <button type="button" className="danger" onClick={() => removeExtraPrompt(index)}>Remove</button>
          </div>
          <MarkdownBoxEditor
            title="Extra text"
            value={prompt.text || ""}
            onChange={(value) => updateExtraPrompt(index, "text", value)}
            token={token}
            monthSlug={monthSlug}
          />
        </article>
      ))}

      <MarkdownBoxEditor
        title="Admin notes"
        value={adminNotes}
        onChange={updateAdminNotes}
        token={token}
        monthSlug={monthSlug}
      />
    </div>
  );
}

function formatMetric(value) {
  return Number(value || 0).toLocaleString();
}

function eventLabel(name = "") {
  return {
    page_view: "Page views",
    ask_ai_click: "Ask AI clicks",
    ask_mods_click: "Ask mods clicks",
    copy_prompt_click: "Prompt copies",
  }[name] || name.replace(/_/g, " ");
}

function shortDate(value = "") {
  if (!value) return "";
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}

function AnalyticsBars({ rows = [] }) {
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [
      Number(row.page_views || 0),
      Number(row.help_clicks || 0),
      Number(row.copy_clicks || 0),
    ])
  );
  const barHeight = (value) => (value ? Math.max(4, (value / max) * 100) : 0);

  return (
    <div className="analytics-bars" aria-label="14 day website activity">
      {rows.map((row) => (
        <div className="analytics-bar-day" key={row.date}>
          <div className="analytics-bar-stack">
            <span className="views" style={{ height: `${barHeight(row.page_views || 0)}%` }} title={`${row.page_views} page views`} />
            <span className="help" style={{ height: `${barHeight(row.help_clicks || 0)}%` }} title={`${row.help_clicks} help clicks`} />
            <span className="copies" style={{ height: `${barHeight(row.copy_clicks || 0)}%` }} title={`${row.copy_clicks} prompt copies`} />
          </div>
          <small>{shortDate(row.date)}</small>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel({ rows, report, total, refresh }) {
  const summary = report?.summary || {};
  const topPages = report?.top_pages || [];
  const helpByStep = report?.help_by_step || [];
  const eventBreakdown = report?.event_breakdown || [];
  const latestEvents = report?.latest_events || [];

  return (
    <div className="admin-stack analytics-dashboard">
      <div className="admin-section-actions">
        <div>
          <h2>Website analytics</h2>
          <p className="muted">Full Mastery site activity from the last 90 days, with the trend graph focused on the last 14 days.</p>
        </div>
        <button type="button" onClick={refresh}>Refresh</button>
      </div>

      <div className="analytics-kpis" aria-label="Website analytics summary">
        <article>
          <span>Page views</span>
          <strong>{formatMetric(summary.page_views)}</strong>
        </article>
        <article>
          <span>Visitors</span>
          <strong>{formatMetric(summary.unique_sessions)}</strong>
        </article>
        <article>
          <span>Help clicks</span>
          <strong>{formatMetric(summary.help_clicks || total)}</strong>
        </article>
        <article>
          <span>Prompt copies</span>
          <strong>{formatMetric(summary.copy_clicks)}</strong>
        </article>
        <article>
          <span>Top page</span>
          <strong>{summary.top_page || "No data yet"}</strong>
        </article>
      </div>

      <article className="admin-card admin-card-wide">
        <div className="analytics-card-head">
          <h3>14-day activity</h3>
          <div className="analytics-legend">
            <span className="views">Page views</span>
            <span className="help">Help clicks</span>
            <span className="copies">Prompt copies</span>
          </div>
        </div>
        <AnalyticsBars rows={report?.trend || []} />
      </article>

      <div className="analytics-grid">
        <article className="admin-card">
          <h3>Top pages</h3>
          <div className="analytics-list">
            {topPages.length ? topPages.map((page) => (
              <div className="analytics-list-row" key={page.page_path}>
                <span>
                  <strong>{page.label}</strong>
                  <small>{page.page_path}</small>
                </span>
                <b>{formatMetric(page.views)}</b>
              </div>
            )) : <p className="muted">No page views yet.</p>}
          </div>
        </article>

        <article className="admin-card">
          <h3>Event mix</h3>
          <div className="analytics-list">
            {eventBreakdown.length ? eventBreakdown.map((event) => (
              <div className="analytics-list-row" key={event.event_name}>
                <span>
                  <strong>{eventLabel(event.event_name)}</strong>
                  <small>{formatMetric(event.unique_sessions)} visitors</small>
                </span>
                <b>{formatMetric(event.count)}</b>
              </div>
            )) : <p className="muted">No events yet.</p>}
          </div>
        </article>
      </div>

      <article className="admin-card admin-card-wide">
        <h3>Guide support demand</h3>
        <div className="admin-analytics-table admin-analytics-table-support" role="table">
          <div role="row">
            <strong>Guide</strong>
            <strong>Step</strong>
            <strong>Ask AI</strong>
            <strong>Ask mods</strong>
            <strong>Total</strong>
            <strong>Unique</strong>
          </div>
          {helpByStep.map((row) => (
            <div role="row" key={`${row.guide_name}-${row.step_number}-${row.step_title}`}>
              <span>{row.guide_name}</span>
              <span>{row.step_number ? `${row.step_number}. ` : ""}{row.step_title}</span>
              <span>{row.ask_ai_clicks}</span>
              <span>{row.ask_mods_clicks}</span>
              <span>{row.total_clicks}</span>
              <span>{row.unique_sessions}</span>
            </div>
          ))}
          {!helpByStep.length && <p className="muted">No guide support clicks yet.</p>}
        </div>
      </article>

      <article className="admin-card admin-card-wide">
        <h3>Ask AI / Ask mods by day</h3>
        <div className="admin-analytics-table" role="table">
          <div role="row">
            <strong>Date</strong>
            <strong>Event</strong>
            <strong>Guide</strong>
            <strong>Step</strong>
            <strong>Clicks</strong>
            <strong>Unique</strong>
          </div>
          {rows.map((row) => (
            <div role="row" key={`${row.event_date}-${row.event_name}-${row.guide_name}-${row.step_number}`}>
              <span>{row.event_date}</span>
              <span>{eventLabel(row.event_name)}</span>
              <span>{row.guide_name}</span>
              <span>{row.step_number}. {row.step_title}</span>
              <span>{row.clicks}</span>
              <span>{row.unique_sessions}</span>
            </div>
          ))}
          {!rows.length && <p className="muted">No daily support rows yet.</p>}
        </div>
      </article>

      <article className="admin-card admin-card-wide">
        <h3>Latest events</h3>
        <div className="admin-analytics-table admin-analytics-table-events" role="table">
          <div role="row">
            <strong>Time</strong>
            <strong>Event</strong>
            <strong>Page</strong>
            <strong>Detail</strong>
          </div>
          {latestEvents.map((event) => (
            <div role="row" key={`${event.created_at}-${event.event_name}-${event.session_id}`}>
              <span>{new Date(event.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              <span>{eventLabel(event.event_name)}</span>
              <span>{event.page_path || "/"}</span>
              <span>{event.step_title || event.metadata?.prompt_title || event.metadata?.path || ""}</span>
            </div>
          ))}
          {!latestEvents.length && <p className="muted">No events yet.</p>}
        </div>
      </article>
    </div>
  );
}
