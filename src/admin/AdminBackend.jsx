import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { JULY_CONTENT } from "../julyContent.js";
import MasteryRequests from "./MasteryRequests.jsx";

const TOKEN_KEY = "mastery_admin_token";
const WORKSHOP_YEAR = "2026";
const MASTERY_ORIGIN = "https://mastery.aiadvantage.com";

const UPCOMING_MONTH_PRESETS = [
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

const CONTENT_TABS = ["basics", "guide", "challenge", "prompts", "extras"];
const ADMIN_SECTIONS = ["content", "analytics", "requests"];
const RESOURCE_CATEGORIES = ["Workshop", "Extras", "Other"];
const RESOURCE_STATUSES = ["idea", "first draft", "tested", "final"];
const CLAUDE_DESKTOP_URL = "https://claude.com/download";
const GITHUB_URL = "https://github.com/";
const LOVABLE_URL = "https://lovable.dev/";

const JULY_PREREQUISITES = [
  {
    label: "GitHub account ready",
    detail: "Create a free GitHub account and make sure you are signed in before you start the guide.",
    link: GITHUB_URL,
    linkLabel: "Open GitHub",
  },
  {
    label: "Lovable account ready",
    detail: "Create a free Lovable account and make sure you are signed in with GitHub connected.",
    link: LOVABLE_URL,
    linkLabel: "Open Lovable",
  },
  {
    label: "Mastery Resources account ready",
    detail: "Make sure you can sign in here with the same email or Google account connected to your AI Mastery access.",
    link: "/sign-in",
    linkLabel: "Sign in to Mastery Resources",
    internal: true,
  },
  {
    label: "Claude Pro, Max, or Team plan",
    detail: "Cowork is required for this workflow, so make sure you are signed into a Claude plan that includes it.",
    link: "https://claude.com/settings/billing",
    linkLabel: "Check Claude plan",
  },
  {
    label: "Claude Desktop app installed",
    detail: "Install the desktop app before Step 6, then open the Cowork tab inside Claude.",
    link: CLAUDE_DESKTOP_URL,
    linkLabel: "Download Claude Desktop",
  },
  {
    label: "July Live Prompts ready",
    detail: "Open the July Live Prompts page so the Lovable setup, Cowork connect, CLAUDE.md, Daily Briefing, and Help prompts are ready.",
    link: "/monthly-resources/july/prompts",
    linkLabel: "Open Live Prompts",
    internal: true,
  },
];

const STEP_SUBHEADLINES = {
  "Step 1: Create Your Paperwork Folder + Connect Cowork": "Connect Claude Cowork to one clean workspace so it can create, read, and update your paperwork files.",
  "Step 2: Get Your Materials Bundle": "Download the June materials and let Claude unpack the exact folder structure for the workflow.",
  "Step 3: Paperwork Setup": "Use Igor's demo DNA to generate the first paperwork profile Claude will use to fill forms.",
  "Step 4: Review the Files": "Open the generated profile so you can see the kind of reusable information the system stores.",
  "Step 5: Fill Your Form": "Run the form-filling prompt and produce a completed W-8BEN from the profile Claude just built.",
  "Step 6: Read the Missing-Info Section": "Use Claude's gap list to see what the profile still needs before the next run.",
  "Step 7: Reset. Let Claude Clean Up.": "Clear the demo files while keeping the reusable workspace, prompts, form, and skill folder.",
  "Step 8: Install the Paperwork Skill": "Turn the workflow into an installed Claude skill so you can launch it from Cowork without pasting prompts.",
  "Step 9: Add YOUR DNA + Run the Skill": "Swap in your own DNA, run the skill, answer missing fields, and grow your paperwork profile.",
  "Step 10: Run the Skill Again (See the Compounding)": "Run a second form to watch the missing-info list shrink as your profile gets sharper.",
  "Step 1: Create Your GitHub and Lovable Accounts": "Create the free GitHub and Lovable accounts your Hub is built on.",
  "Step 2: Set Up Lovable": "Paste the setup prompt and let Lovable build your Hub.",
  "Step 3: Connect Lovable to GitHub": "Connect Lovable to GitHub so it can create your private repository.",
  "Step 4: Generate Your GitHub Token": "Generate a fine-grained GitHub token so your Hub and Claude can reach your repo.",
  "Step 5: Hand the Token and the Repository Name to Lovable": "Paste your token and repo name into Lovable to clear the 401 error.",
  "Step 6: Set Up Your AgentHub Folder in Cowork": "Set up a Cowork folder and give it the token it needs to talk to GitHub.",
  "Step 7: Connect Cowork to Your Repository": "Connect Cowork to your repository and watch new cards appear on the Hub.",
  "Step 8: Create CLAUDE.md (The Standing Rule)": "Let Claude write CLAUDE.md with the card-emitter standing rule inside.",
  "Step 9: Create a New Card for Daily Briefing": "Create a scheduled task, run it once, and watch it appear in your Hub.",
  "Step 10: Use the Ideas + Wins Board": "Drop an idea on the kanban, drag it to Done, watch it become a Win.",
};

const STEP_EXPLAINERS = {
  "Step 1: Create Your GitHub and Lovable Accounts": "So basically, this step gets your two main accounts ready so Lovable and GitHub can work together.",
  "Step 2: Set Up Lovable": "This is where Lovable builds the first version of your Hub, and the scary-looking error is expected for now.",
  "Step 3: Connect Lovable to GitHub": "Now you connect Lovable to GitHub so your Hub has a private home for its files.",
  "Step 4: Generate Your GitHub Token": "This step creates the private key your Hub and Claude use to read and write your files safely.",
  "Step 5: Hand the Token and the Repository Name to Lovable": "Now you paste the key and repo name into Lovable so the Hub can finally load your cards.",
  "Step 6: Set Up Your AgentHub Folder in Cowork": "This is where you make one clean folder on your computer that Claude can use as its working space.",
  "Step 7: Connect Cowork to Your Repository": "Now Claude writes your first Hub card into GitHub, and you reload the Hub to see it appear.",
  "Step 8: Create CLAUDE.md (The Standing Rule)": "This step gives Claude a simple rulebook so it knows how to write Hub cards the same way every time.",
  "Step 9: Create a New Card for Daily Briefing": "Now you set up your first automatic task, run it once, and watch it publish into your Hub.",
  "Step 10: Use the Ideas + Wins Board": "This is the quick win: add an idea, move it to Done, and see your Hub turn it into a Win.",
};

const MARKDOWN_BLOCKS = [
  { label: "Page Title", template: "# Page Title\n\n" },
  { label: "Generic Card", template: "## New Card\n\nWrite the card content here.\n\n" },
  { label: "Prep Card", template: "## Before You Start\n\nUse this card for the setup checklist members need before the guide.\n\n" },
  { label: "Outcome Card", template: "## What You'll Have When Done\n\n- [ ] Clear outcome one\n- [ ] Clear outcome two\n\n" },
  { label: "Step Card", template: "## Step 1: New Step\n\nWrite one clear sentence explaining the outcome.\n\n1. First instruction.\n2. Second instruction.\n\n" },
  { label: "Bonus Card", template: "## 🏆 Bonus: New Bonus\n\n1. First bonus instruction.\n\n" },
  { label: "Finish Card", template: "## Next Steps\n\n- What to do next.\n\n" },
  { label: "Subheading", template: "### New Subheading\n\n" },
  { label: "Bullet", template: "- New bullet\n" },
  { label: "Check", template: "- [ ] New checklist item\n" },
  { label: "Callout", template: "💡 **Tip:** Add a helpful note here.\n\n" },
  { label: "Warning", template: "🛟 **Heads up:** Add the important warning here.\n\n" },
  { label: "Code", template: "```\nPaste code or prompt text here.\n```\n\n" },
  { label: "Quote", template: "> Add a quote or key teaching line here.\n\n" },
  { label: "Divider", template: "\n---\n\n" },
  { label: "Copy Prompt", template: "\n[[copy-prompt:1]]\n\n" },
  { label: "Challenge Prompt", template: "\n[[copy-challenge-prompt]]\n\n" },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  const now = new Date();
  const nextMonthIndex = (now.getMonth() + 1) % 12;
  const nextPreset = UPCOMING_MONTH_PRESETS.find((preset) => {
    const presetMonthIndex = new Date(`${preset.label} 1, ${now.getFullYear()}`).getMonth();
    return presetMonthIndex === nextMonthIndex;
  });

  if (nextPreset && items.some((item) => item.slug === nextPreset.slug)) return nextPreset.slug;
  return items.find((item) => !item.is_published)?.slug || items[0]?.slug || "";
}

function monthTemplateGuide(label) {
  return `## Table of Contents

## What You'll Have When Done

- [ ] Clear workshop outcome
- [ ] Working setup from the live session
- [ ] Prompt or tool ready to reuse after the workshop

---

## Before You Start

- [ ] Account or tool one ready
- [ ] Account or tool two ready
- [ ] Any starter file, DNA, or template ready

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
        type: "Walkthrough",
        title: `${label} Guide`,
        description: "Follow the full walkthrough for this month's build.",
        status: "first draft",
        url: `/monthly-resources/${slug}/guide`,
      },
      {
        category: "Workshop",
        type: "Copy-paste",
        title: "Live Prompts",
        description: "Use these alongside the live workshop when you just need the prompts to follow each step.",
        status: "first draft",
        url: `/monthly-resources/${slug}/prompts`,
      },
      {
        category: "Other",
        type: "Recordings",
        title: `${label} Recordings`,
        description: `Add the ${label} workshop replay link here once the recordings are ready.`,
        status: "idea",
        url: "",
      },
      {
        category: "Other",
        type: "Challenge",
        title: `${label} Challenge`,
        description: "Use what you built this month, submit your version, and see what other members made.",
        status: "first draft",
        url: `/challenges/${slug}`,
      },
      {
        category: "Extras",
        type: "Video + Prompts",
        title: "Go Deeper",
        description: "Use optional follow-up prompts when members are ready to extend the system after the live workshop.",
        status: "idea",
        url: `/monthly-resources/${slug}/extras`,
      },
    ],
    guide_markdown: monthTemplateGuide(label),
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

function adminDeepLink(slug, tab = "basics") {
  return `/admin?month=${encodeURIComponent(slug)}&tab=${encodeURIComponent(tab)}`;
}

function resourceEditorTab(item = {}) {
  const haystack = `${item.category || ""} ${item.type || ""} ${item.title || ""} ${item.url || ""}`.toLowerCase();
  if (haystack.includes("challenge")) return "challenge";
  if (haystack.includes("extra") || haystack.includes("publishing")) return "extras";
  if (haystack.includes("live") || haystack.includes("prompt") || haystack.includes("/prompts")) return "prompts";
  return "guide";
}

function resourceEditorLabel(tab) {
  return {
    basics: "Month setup",
    guide: "Guide markdown",
    challenge: "Challenge content",
    prompts: "Live prompts",
    extras: "Extras",
  }[tab] || "Content";
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
  if (!res.ok) throw new Error(data.error || "Admin request failed");
  return data;
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
  const [activeTab, setActiveTab] = useState("guide");
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

  const canLoad = Boolean(token);
  const selectedSummary = months.find((item) => item.slug === selectedSlug);
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

    setSaveState("dirty");
    setStatus("Unsaved changes");
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      persistMonth(monthRef.current, { source: "auto" });
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [month]);

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

  async function loadMonth(slug) {
    setError("");
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=month&slug=${encodeURIComponent(slug)}`);
      const template = templateForSlug(slug);
      const nextMonth = data.month || template;
      lastSavedSnapshotRef.current = JSON.stringify(nextMonth || null);
      setMonth(nextMonth);
      setActiveResourceIndex(null);
      setSaveState(data.month ? "saved" : "idle");
      setLastSavedAt(data.month ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
      setStatus(data.month ? "Saved" : template ? "Template ready. Save to create this month." : "");
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

  function applyMonthlyTemplate() {
    setMonth((current) => {
      if (!current?.slug) return current;
      const template = createMonthTemplate({
        slug: current.slug,
        label: current.label || current.slug,
        topic: current.topic || "To be announced",
        focus: current.focus || `${current.label || current.slug} Mastery Workshop`,
        outcome: current.outcome || "",
      });

      return {
        ...current,
        hero: template.hero,
        resources: template.resources,
        guide_markdown: template.guide_markdown,
        challenge_markdown: template.challenge_markdown,
        challenge_prompt: template.challenge_prompt,
        prompts: template.prompts,
        extras: template.extras,
        admin_notes: current.admin_notes || template.admin_notes,
      };
    });
    setActiveResourceIndex(null);
    setActiveTab("basics");
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

  function addResource() {
    setMonth((current) => ({
      ...current,
      resources: [
        ...(current?.resources || []),
        { category: "Workshop", type: "Resource", title: "New Resource", description: "", status: "idea", url: "" },
      ],
    }));
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
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= resources.length) return current;
      [resources[index], resources[nextIndex]] = [resources[nextIndex], resources[index]];
      return { ...current, resources };
    });
    setActiveResourceIndex((current) => {
      if (current === index) return index + direction;
      if (current === index + direction) return index;
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
          month: { ...monthToSave, updated_by: userLabel },
        }),
      });
      const currentSnapshot = JSON.stringify(monthRef.current);
      if (requestId === saveRequestIdRef.current && currentSnapshot === requestSnapshot) {
        lastSavedSnapshotRef.current = JSON.stringify(data.month);
        setMonth(data.month);
        setSaveState("saved");
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setStatus(source === "auto" ? "Draft autosaved" : "Version saved");
        if (source !== "auto") await loadHistory(data.month.slug);
      } else {
        setSaveState("dirty");
        setStatus("Unsaved changes");
      }
      if (data.month?.slug) setSelectedSlug(data.month.slug);
      await loadMonths();
      return data.month;
    } catch (err) {
      setError(err.message);
      setSaveState("error");
      setStatus("Save failed");
      return null;
    }
  }

  async function saveMonth() {
    await persistMonth(monthRef.current, { source: "manual" });
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
        }),
      });
      lastSavedSnapshotRef.current = JSON.stringify(data.month);
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

  async function publishMonth(isPublished) {
    if (!month?.slug) return;
    if (isPublished) {
      const confirmed = window.confirm(`Publish ${month.label || month.slug} now? Members will be able to access this month's content.`);
      if (!confirmed) return;
      const currentSnapshot = JSON.stringify(monthRef.current);
      if (currentSnapshot !== lastSavedSnapshotRef.current) {
        const savedMonth = await persistMonth(monthRef.current, { source: "manual" });
        if (!savedMonth) return;
      }
    }

    setStatus(isPublished ? "Publishing..." : "Unpublishing...");
    setError("");
    try {
      const data = await adminFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({
          action: "publish",
          slug: month.slug,
          is_published: isPublished,
          updated_by: userLabel,
        }),
      });
      lastSavedSnapshotRef.current = JSON.stringify(data.month);
      setMonth(data.month);
      await loadMonths();
      setStatus(isPublished ? "Published. Members can access this month." : "Unpublished.");
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
            disabled={!month || saveState === "saving"}
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
          <PublicationToggle month={month} onChange={publishMonth} />
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
                      {item.label} ({item.is_published ? "Live" : item.status})
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={loadMonths}>Refresh months</button>
            </div>

            {!month ? (
              <div className="admin-empty">
                <h2>Select a month.</h2>
                <p>Use the resource cards as the main editing map for each draft month.</p>
              </div>
            ) : (
              <div className="admin-stack">
                <BasicsEditor
                  month={month}
                  token={token}
                  updateMonth={updateMonth}
                  updateHero={updateHero}
                  updateResource={updateResource}
                  addResource={addResource}
                  removeResource={removeResource}
                  moveResource={moveResource}
                  applyMonthlyTemplate={applyMonthlyTemplate}
                  activeResourceIndex={activeResourceIndex}
                  onEditResource={(item, index) => {
                    const nextTab = resourceEditorTab(item);
                    setActiveResourceIndex(index);
                    setActiveTab(nextTab);
                    window.history.replaceState({}, "", adminDeepLink(selectedSlug || getDefaultMonthSlug(months), nextTab));
                    requestAnimationFrame(() => {
                      document.getElementById("admin-resource-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }}
                />

                <section className="admin-card admin-card-wide" id="admin-resource-editor">
                  <div className="admin-section-actions">
                    <div>
                      <p className="admin-order-label">4 · Selected card content</p>
                    </div>
                  </div>
                  {activeTab === "basics" && (
                    <p className="muted">Choose Edit on a resource card to open its content here.</p>
                  )}
                  {activeTab === "guide" && (
                  <MarkdownBoxEditor
                    title="Guide markdown"
                    value={month.guide_markdown || ""}
                    onChange={(value) => updateMonth({ guide_markdown: value })}
                    previewKind="guide"
                    token={token}
                    monthSlug={month.slug}
                    documentKey="guide"
                    actor={{ id: user?.id, name: user?.fullName || userLabel, email: user?.primaryEmailAddress?.emailAddress || "", avatar: user?.imageUrl || "" }}
                  />
                  )}
                  {activeTab === "challenge" && (
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
                  />
                  </div>
                  )}
                  {activeTab === "prompts" && (
                  <PromptEditor
                    prompts={month.prompts || []}
                    updatePrompt={updatePrompt}
                    addPrompt={addPrompt}
                    removePrompt={removePrompt}
                    token={token}
                    monthSlug={month.slug}
                  />
                  )}
                  {activeTab === "extras" && (
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

function PublicationToggle({ month, onChange }) {
  const isPublished = Boolean(month?.is_published);

  return (
    <div className="publish-toggle" aria-label="Publication status">
      <button
        type="button"
        className={!isPublished ? "active" : ""}
        onClick={() => isPublished && onChange(false)}
        disabled={!month?.slug || !isPublished}
      >
        Draft
      </button>
      <button
        type="button"
        className={isPublished ? "active live" : ""}
        onClick={() => !isPublished && onChange(true)}
        disabled={!month?.slug || isPublished}
      >
        Published
      </button>
    </div>
  );
}

const VERSION_FIELDS = [
  ["focus", "Workshop title"],
  ["outcome", "Outcome"],
  ["hero", "Hero"],
  ["resources", "Resources"],
  ["guide_markdown", "Guide"],
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
  month,
  token,
  updateMonth,
  updateHero,
  updateResource,
  addResource,
  removeResource,
  moveResource,
  applyMonthlyTemplate,
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
      <div className="admin-card">
        <p className="admin-order-label">1 · Page settings</p>
        <h2>Month setup</h2>
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
        <p className="admin-order-label">2 · Top of workshop page</p>
        <h2>Hero</h2>
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
      <div className="admin-card admin-card-wide">
        <div className="admin-section-actions">
          <div>
            <p className="admin-order-label">3 · Frontend card order</p>
            <h2>Resource cards</h2>
            <p className="muted">Cards appear on the member page in this exact top-to-bottom order. Reorder them here, then use Edit to open the matching content below.</p>
          </div>
          <div className="admin-inline-actions">
            <button type="button" onClick={applyMonthlyTemplate}>Apply July Page Template</button>
            <button type="button" onClick={addResource}>Add Card</button>
          </div>
        </div>
        <div className="admin-resource-table" role="table" aria-label="Resource cards">
          <div className="admin-resource-row admin-resource-head" role="row">
            <span>Category</span>
            <span>Type</span>
            <span>Title</span>
            <span>Description</span>
            <span>Status</span>
            <span>Link</span>
            <span>Order & actions</span>
          </div>
          {(month.resources || []).map((item, index) => (
            <div className="admin-resource-row" role="row" key={`${item.type}-${index}`}>
              <label className="admin-resource-field"><span>Category</span><select value={item.category || "Workshop"} onChange={(event) => updateResource(index, "category", event.target.value)} aria-label="Category">
                {RESOURCE_CATEGORIES.map((category) => <option value={category} key={category}>{category}</option>)}
              </select></label>
              <label className="admin-resource-field"><span>Type</span><input value={item.type || ""} onChange={(event) => updateResource(index, "type", event.target.value)} placeholder="Type" aria-label="Type" /></label>
              <label className="admin-resource-field"><span>Title</span><input value={item.title || ""} onChange={(event) => updateResource(index, "title", event.target.value)} placeholder="Title" aria-label="Title" /></label>
              <label className="admin-resource-field"><span>Description</span><textarea value={item.description || ""} onChange={(event) => updateResource(index, "description", event.target.value)} placeholder="Description" rows={2} aria-label="Description" /></label>
              <label className="admin-resource-field"><span>Status</span><select value={RESOURCE_STATUSES.includes(item.status) ? item.status : "idea"} onChange={(event) => updateResource(index, "status", event.target.value)} aria-label="Status">
                {RESOURCE_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
              </select></label>
              <label className="admin-resource-field"><span>Link</span><textarea value={item.url || ""} onChange={(event) => updateResource(index, "url", event.target.value)} placeholder="Link" rows={2} aria-label="Link" /></label>
              <div className="admin-resource-actions">
                <div className="admin-order-actions" aria-label={`Reorder ${item.title || `resource ${index + 1}`}`}>
                  <span>#{index + 1}</span>
                  <button type="button" onClick={() => moveResource(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => moveResource(index, 1)} disabled={index === (month.resources || []).length - 1} aria-label="Move down">↓</button>
                </div>
                <button
                  type="button"
                  className={activeResourceIndex === index ? "active" : ""}
                  onClick={() => onEditResource(item, index)}
                >
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => removeResource(index)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarkdownBoxEditor({ title, value, onChange, previewKind = "document", token, monthSlug, documentKey = "document", actor }) {
  const [mode, setMode] = useState("edit");
  const [uploadState, setUploadState] = useState("");
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [commentSelection, setCommentSelection] = useState(null);
  const [commentState, setCommentState] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token || !monthSlug) return;
    loadComments();
  }, [token, monthSlug, documentKey]);

  async function loadComments() {
    try {
      const data = await adminFetch(token, `/api/mastery-admin?action=comments&slug=${encodeURIComponent(monthSlug)}&document_key=${encodeURIComponent(documentKey)}`);
      setComments(data.comments || []);
      setCommentState("");
    } catch (err) {
      setCommentState(err.message || "Could not load comments");
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
        }),
      });
      setCommentSelection(null);
      setCommentDraft("");
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
      const alt = window.prompt("Alt text", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")) || "Screenshot";
      insertText(`\n![${alt}](${data.url})\n\n`);
      setUploadState("Screenshot inserted");
      window.setTimeout(() => setUploadState(""), 2200);
    } catch (err) {
      setUploadState(err.message || "Upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <article className="markdown-editor-box">
      <div className="markdown-editor-head">
        <h2>{title}</h2>
        <div>
          <button type="button" className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}>Edit</button>
          <button type="button" className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}>Preview</button>
        </div>
      </div>
      {mode === "edit" && (
        <div className="notion-editor-toolbar" aria-label={`${title} block controls`}>
          <div className="notion-editor-row">
            {MARKDOWN_BLOCKS.map((block) => (
              <button type="button" key={block.label} onClick={() => insertText(block.template)}>
                {block.label}
              </button>
            ))}
          </div>
          <p className="admin-toolbar-hint">
            Step cards are created with <strong>Step Card</strong>. The customer preview turns each <code>## Step 1: Title</code> heading into a numbered guide card. <strong>Prep Card</strong> creates the setup checklist card.
          </p>
          <div className="notion-editor-row notion-editor-row-inline">
            <button type="button" onClick={() => wrapSelection("**")}>Bold</button>
            <button type="button" onClick={() => wrapSelection("*")}>Italic</button>
            <button type="button" onClick={() => wrapSelection("`")}>Code Text</button>
            <button type="button" onClick={() => insertText((selected) => `[${selected || "Link text"}](https://example.com)`)}>Link</button>
            <input
              ref={fileInputRef}
              className="admin-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => uploadScreenshot(event.target.files?.[0])}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()}>Upload Screenshot</button>
            <button type="button" onClick={addImageUrl}>Image URL</button>
            {hasSelection && <button type="button" className="comment-button" onClick={startComment}>Comment on selection</button>}
          </div>
          {uploadState && <p className="admin-upload-status">{uploadState}</p>}
        </div>
      )}
      {mode === "edit" ? (
        <div className="markdown-collaboration-layout">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onSelect={(event) => setHasSelection(event.currentTarget.selectionEnd > event.currentTarget.selectionStart)}
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
        <div className="markdown-editor-preview">
          <CustomerMarkdownPreview content={value} kind={previewKind} />
        </div>
      )}
    </article>
  );
}

function CustomerMarkdownPreview({ content, kind }) {
  if (!content?.trim()) return <p className="admin-preview-empty">Nothing written yet.</p>;
  if (kind === "guide") return <GuideCustomerPreview content={content} />;
  if (kind === "challenge") return <ChallengeCustomerPreview content={content} />;
  return <MarkdownBlocks blocks={blocksWithHeadingIds(content)} />;
}

function GuideCustomerPreview({ content }) {
  const guide = useMemo(() => getGuideModel(content), [content]);

  if (!guide.introSections.length && !guide.steps.length && !guide.closingSections.length) {
    return <GenericGuideCards content={content} />;
  }

  return (
    <div className="admin-customer-preview">
      <div className="workbench-layout">
        <div className="workbench-stack">
          {guide.introSections.map((section) => (
            <IntroCustomerPreview section={section} key={section.title} />
          ))}
          {guide.steps.map((step, index) => (
            <article className="workbench-step" id={step.id} key={step.id}>
              <div className="workbench-step-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
                {index + 1 !== 9 && <AdminStepHelpActions />}
              </div>
              {step.explainer && <p className="workbench-step-explainer">{step.explainer}</p>}
              <h3>{step.title}</h3>
              {!step.explainer && step.summary && <p className="workbench-step-subtitle">{step.summary}</p>}
              <MarkdownBlocks blocks={step.blocks} />
            </article>
          ))}
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

function IntroCustomerPreview({ section }) {
  return (
    <article className="workbench-step workbench-intro" id={section.id}>
      <div className="workbench-step-top">
        <span>{section.title === "Before You Start" ? "Prep checklist" : "Prep"}</span>
      </div>
      <h3>{section.title}</h3>
      <MarkdownBlocks blocks={section.blocks} />
    </article>
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
  const introTitles = new Set(["What You'll Have When Done", "Before You Start"]);
  const closingTitles = new Set([
    "🏆 Bonus: Generate Your Certificate",
    "🎨 Bonus: Your Own AI Image Studio",
    "Safety & Security Fixes",
    "Next Steps",
  ]);
  const steps = [];
  let phase = "Prep";

  sections.forEach((section) => {
    if (section.title.startsWith("PART 1")) phase = "Demo";
    if (section.title.startsWith("PART 2")) phase = "Your files";
    if (section.title.startsWith("Step ")) {
      steps.push({
        ...section,
        phase,
        stepNumber: steps.length + 1,
        shortTitle: section.title.replace(/^Step \d+:\s*/, ""),
        summary: STEP_SUBHEADLINES[section.title] || "",
        explainer: STEP_EXPLAINERS[section.title] || "",
      });
    }
  });

  return {
    introSections: sections.filter((section) => introTitles.has(section.title)),
    steps,
    closingSections: sections
      .filter((section) => closingTitles.has(section.title))
      .map((section) => ({
        ...section,
        title: section.title === "Next Steps" ? "You Did It! Next Steps" : section.title,
      })),
  };
}

function splitGuideSections(content) {
  const blocks = buildMarkdownBlocks(content);
  const sections = [];
  let current = null;

  blocks.forEach((block) => {
    if ((block.type === "h3" || block.type === "h4") && block.text !== "Table of Contents") {
      current = {
        id: sectionId(block.text),
        title: block.text,
        blocks: [],
      };
      sections.push(current);
      return;
    }

    if (current && block.type !== "rule" && block.type !== "space") {
      current.blocks.push(block);
    }
  });

  return sections.filter((section) => section.blocks.length || section.title.startsWith("Step "));
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

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      blocks.push({ type: "image", alt: image[1], src: image[2] });
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

function MarkdownBlocks({ blocks }) {
  return (
    <div className="markdown-document markdown-document-embedded">
      {blocks.map((block, index) => <MarkdownBlock key={`${index}-${block.type}-${block.text?.slice(0, 12) || ""}`} block={block} />)}
    </div>
  );
}

function MarkdownHeading({ block }) {
  const Tag = block.type;
  return <Tag id={block.id}>{renderInlineMarkdown(block.text)}</Tag>;
}

function MarkdownBlock({ block }) {
  if (block.type === "space") return <div className="md-space" />;
  if (block.type === "rule") return <hr className="md-rule" />;
  if (block.type === "code") return <AdminCopyableCodeBlock text={block.text} />;
  if (block.type === "image") {
    const figureClassName = [
      "md-figure",
      block.src === "/july/ch7-18.png" ? "md-figure-compact-phone" : "",
    ].filter(Boolean).join(" ");

    return (
      <figure className={figureClassName}>
        <img className="md-image" src={block.src} alt={block.alt} loading="lazy" />
        {block.alt && <figcaption>{block.alt}</figcaption>}
      </figure>
    );
  }
  if (block.type === "copy-prompt") return <AdminCopyPromptButton promptNumber={block.prompt} />;
  if (block.type === "copy-challenge-prompt") return <AdminChallengePromptButton />;
  if (block.type === "h3" || block.type === "h4" || block.type === "h5") return <MarkdownHeading block={block} />;
  if (block.type === "quote") return <blockquote className="md-quote">{renderInlineMarkdown(block.text)}</blockquote>;
  if (block.type === "check") return <p className="md-check">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "bullet") return <p className="md-bullet">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "step") return <p className="md-step">{renderInlineMarkdown(block.text)}</p>;
  return <p>{renderInlineMarkdown(block.text)}</p>;
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
  const prompt = (JULY_CONTENT.prompts || []).find((p) => {
    const title = p.title || "";
    return title.startsWith(`Prompt ${promptNumber}:`) || title.startsWith(`Prompt ${promptNumber} (`);
  });
  const label = prompt?.title || `Prompt ${promptNumber}`;

  return (
    <button type="button" className="guide-copy-prompt admin-preview-copy" disabled>
      Copy {label}
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
