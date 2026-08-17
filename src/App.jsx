import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { supabase } from "./lib/supabase.js";
import { trackEvent, trackStepHelpClick } from "./lib/analytics.js";
import {
  normalizePromptContext,
  parsePromptControlMarker,
  resolvePromptControl,
} from "./lib/prompt-controls.js";
import AdminBackend from "./admin/AdminBackend.jsx";
import { MONTH6_CONTENT } from "./month6Content.js";
import { JULY_CONTENT } from "./julyContent.js";
import { JULY_CATCHUP_FAQ } from "./data/julyCatchupFaq.js";
import { JULY_CHALLENGE_ARCHIVE } from "./data/julyChallengeArchive.js";
import FundamentalsJulyPage from "./FundamentalsJulyPage.jsx";
import {
  ADD_PROMPT_LIBRARY_CARD_PROMPT,
  AGENTHUB_PROJECT_INSTRUCTIONS_PROMPT,
} from "./agentHubBuilderPrompt.js";

const CURRENT_MONTH_ID = "jul";
const CURRENT_WORKSHOP_SLUG = "july";
const CURRENT_WORKSHOP_PATH = "/current-workshop";
const WORKSHOP_YEAR = "2026";
const CANONICAL_WORKSHOP_PREFIX = `/workshops/${WORKSHOP_YEAR}`;
const JULY_PREREQUISITES_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1204164726?title=0&byline=0&portrait=0";
const JULY_GUIDE_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1206968779?title=0&byline=0&portrait=0";
const JULY_EXTRAS_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1207545766?title=0&byline=0&portrait=0";
const AUGUST_GUIDE_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1214336649?title=0&byline=0&portrait=0";

const GUIDE_VIDEO_BY_MONTH = {
  july: {
    title: "July AI Hub Video Guide",
    embedUrl: JULY_GUIDE_VIDEO_EMBED_URL,
    ariaLabel: "July AI Hub video guide",
    description: "Watch the walkthrough first, then use the written guide below when you want the exact steps, screenshots, and copy buttons.",
  },
  august: {
    title: "August Personal CRM Video Guide",
    embedUrl: AUGUST_GUIDE_VIDEO_EMBED_URL,
    ariaLabel: "August Personal CRM video guide",
    description: "Watch the walkthrough first, then use the written guide below when you want the exact steps, screenshots, and copy buttons.",
  },
};

const MONTHS = [
  {
    id: "jun",
    label: "June",
    number: "June",
    topic: "Paperwork",
    status: "Available",
    available: true,
    focus: "Your AI Handles the Paperwork",
    outcome: "By the end of this month, you will have a paperwork system that fills forms, shows what is missing, and gets smarter after each run.",
    image: {
      src: "/month6/alternates/month6-paperwork-alt-1.png",
      alt: "A paperwork form preview used for June",
      kicker: "Past month",
      title: "June: Paperwork",
      caption: "Guide, session prompts, replay, and challenge in one path.",
    },
    resources: [
      {
        type: "Guide",
        title: "June Guide",
        description: "Complete the Paperwork workflow from workspace setup through skill installation.",
        status: "Start here",
      },
      {
        type: "Prompt Pack",
        title: "Live Materials",
        description: "Copy the setup, form-filling, and reset prompts directly into Claude Cowork.",
        status: "Use with guide",
      },
      {
        type: "Challenge Document",
        title: "Mastery Challenge #6: Build a Self-Improving Skill",
        description: "Build a DNA file, harness, working prompt, and installable skill. Run it three times on real data and submit what improved.",
        status: "Submit this month",
      },
      {
        type: "Replay",
        title: "June Recordings",
        description: "Watch the June replay in the AI Advantage Community.",
        status: "Watch replay",
        url: MONTH6_CONTENT.replayUrl,
      },
    ],
  },
  {
    id: "jul",
    label: "July",
    number: "July",
    topic: "AI Hub",
    status: "Current hub",
    available: true,
    focus: "Build Your AI Hub",
    upstream: "Build the website where everything your AI creates shows up.",
    outcome: "Build your own private AI Hub website where everything your AI creates shows up, with Lovable, GitHub, and Claude Cowork wired together, plus a daily briefing and an ideas board.",
    image: {
      src: "/july/july-ai-hub-card-relatable-3.png",
      alt: "A warm home-office desk with a tablet, phone, checklist, coffee, and papers for the July AI Hub",
      kicker: "Current month",
      title: "July: Build Your AI Hub",
      caption: "",
    },
    resources: [
      { type: "Guide", title: "July Guide", description: "Follow the full walkthrough to build your Hub and connect the main pieces.", status: "Build" },
      { type: "Materials", title: "Live Prompts", description: "Use these alongside the live workshop when you just need the prompts to follow each step.", status: "Live" },
      { type: "Challenge Document", title: "July Challenge", description: "Use what you built this month, submit your version, and see what other members made.", status: "Open" },
    ],
  },
  {
    id: "aug",
    label: "August",
    number: "August",
    topic: "To be announced",
    status: "Upcoming",
    focus: "To be announced",
    upstream: "Monthly direction will be announced in the community calendar.",
    outcome: "The guide, prompts, and challenge details will appear when the month opens.",
    calendarUrl: "https://community.aiadvantage.com/c/mastery-calendar/august-2026-mastery-workshop",
    resources: [],
  },
  {
    id: "sep",
    label: "September",
    number: "September",
    topic: "To be announced",
    status: "Upcoming",
    focus: "To be announced",
    upstream: "Monthly direction will be announced in the community calendar.",
    outcome: "The guide, prompts, and challenge details will appear when the month opens.",
    calendarUrl: "https://community.aiadvantage.com/c/mastery-calendar/sept-2026-mastery-workshop",
    resources: [],
  },
  {
    id: "oct",
    label: "October",
    number: "October",
    topic: "To be announced",
    status: "Upcoming",
    focus: "To be announced",
    upstream: "Monthly direction will be announced in the community calendar.",
    outcome: "The guide, prompts, and challenge details will appear when the month opens.",
    calendarUrl: "https://community.aiadvantage.com/c/mastery-calendar/oct-2026-mastery-workshop",
    resources: [],
  },
  {
    id: "nov",
    label: "November",
    number: "November",
    topic: "To be announced",
    status: "Upcoming",
    focus: "To be announced",
    upstream: "Monthly direction will be announced in the community calendar.",
    outcome: "The guide, prompts, and challenge details will appear when the month opens.",
    calendarUrl: "https://community.aiadvantage.com/c/mastery-calendar/nov-2026-mastery-workshop",
    resources: [],
  },
  {
    id: "dec",
    label: "December",
    number: "December",
    topic: "To be announced",
    status: "Upcoming",
    focus: "To be announced",
    upstream: "Monthly direction will be announced in the community calendar.",
    outcome: "The guide, prompts, and challenge details will appear when the month opens.",
    calendarUrl: "https://community.aiadvantage.com/c/mastery-calendar/dec-2026-mastery-workshop",
    resources: [],
  },
];

const VISIBLE_MONTHS = MONTHS.filter((month) => !month.hidden);
const CURRENT_MONTH = MONTHS.find((month) => month.id === CURRENT_MONTH_ID) || VISIBLE_MONTHS[0] || MONTHS[0];
const CURRENT_MONTH_INDEX = VISIBLE_MONTHS.findIndex((month) => month.id === CURRENT_MONTH_ID);
const JULY_CHALLENGE_CARD = {
  ...CURRENT_MONTH,
  focus: "Paint your AI Hub",
  outcome:
    "Give your Hub a mobile-first look that feels like yours, then submit the refreshed UI, board proof, direction, and design brief.",
  image: {
    src: CURRENT_MONTH.image.src,
    alt: "A warm home-office desk with a tablet, phone, checklist, coffee, and papers for the July AI Hub challenge",
    kicker: "Current challenge",
    title: "July Challenge: Paint your AI Hub",
    caption: "Mobile-first redesign, Design Director prompt, submission path, and prize details.",
  },
};
const JULY_RESOURCE_BANNER = {
  ...CURRENT_MONTH,
  image: {
    ...CURRENT_MONTH.image,
    caption: "",
  },
};

const HOME_VISUALS = [
  {
    src: "/month6/paperwork-folder-structure.png",
    alt: "Paperwork folder structure created for June",
    label: "Workspace",
    title: "Clean folder system",
  },
  {
    src: "/month6/alternates/month6-paperwork-alt-1.png",
    alt: "Filled form preview from the paperwork workflow",
    label: "Output",
    title: "Filled form preview",
  },
  {
    src: "/month6/claude-skills-panel.png",
    alt: "Claude skills panel with the Paperwork skill",
    label: "Skill",
    title: "Installed workflow",
  },
];

const SUBMISSION_STORAGE_KEY = "mastery-hub-submissions";
const FULL_PREVIEW_STORAGE_PREFIX = "mastery_full_preview_";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: CURRENT_WORKSHOP_PATH, label: "Current Workshop", currentWorkshop: true },
  { path: "/past-workshops", label: "Past Workshops", activePrefixes: ["/past-workshops", "/monthly-resources/june", "/challenges/june"] },
  { path: "/faq", label: "FAQ", activePrefixes: ["/faq", "/tutorial"] },
];

const MOD_HELP_URL = "https://community.aiadvantage.com/c/ask-answer-questions/";
const GUIDE_HELP_CONTEXTS = {
  june: {
    guideName: "AI Mastery June Paperwork guide",
    guideLink: "https://mastery.aiadvantage.com/monthly-resources/june/guide",
    overallGoal: "Build a paperwork system that fills forms from your DNA, shows what is missing, and gets smarter every time you run it.",
    aiInstruction: "Help me complete this exact step. Ask me for only the missing information you need. Keep the instructions practical and specific to Claude Cowork and this Paperwork workflow.",
  },
  july: {
    guideName: "AI Mastery July AI Hub guide",
    guideLink: "https://mastery.aiadvantage.com/monthly-resources/july/guide",
    overallGoal: "Build my own private AI Hub website where everything my AI creates shows up, with Lovable, GitHub, and Claude Cowork wired together, plus a daily briefing and an ideas board.",
    aiInstruction: "Help me complete this exact step. Ask me for only the missing information you need. Keep the instructions practical and specific to the July AI Hub workflow, including Lovable, GitHub, GitHub tokens, Claude Cowork, Hub cards, scheduled tasks, Ideas, Wins, Certificate, and Image Studio when relevant.",
  },
};
const CHALLENGE_HELP_CONTEXTS = {
  july: {
    guideName: "AI Mastery July Challenge",
    guideLink: "https://mastery.aiadvantage.com/challenges/july/guide",
    overallGoal: "Give my AI Hub a mobile-first look that feels like mine, then submit the refreshed UI, board proof, direction, and design brief.",
    aiInstruction: "Help me complete this exact challenge step. Ask me for only the missing information you need. Keep the instructions practical, specific, and focused on the July AI Hub redesign workflow.",
  },
};

const MONTH_HELP_OVERRIDES = {
  august: {
    guideName: "AI Mastery August Relationship Manager guide",
    overallGoal: "Build a private AI Relationship Manager in Lovable: a personal CRM that remembers people, important dates, relationship notes, context files, Gmail and Google Calendar connections, automated reminders, a polished app interface, and secure login.",
    aiInstruction: "Help me complete this exact step of the August Relationship Manager build. Stay specific to Lovable, the visible database/table progression, contacts, birthday reminders, relationship context, Gmail, Google Calendar, scheduled jobs, and secure login when relevant. Do not skip ahead. Ask me for only the missing information you need, then give me the next concrete action.",
  },
};
const CHALLENGE_HELP_OVERRIDES = {
  august: {
    guideName: "AI Mastery August Relationship Manager Challenge",
    overallGoal: "Finish and submit the August AI Relationship Manager challenge: prove the personal CRM works with real relationship context, reminders or automations, a usable interface, and a clear explanation of what the system now helps you remember or do.",
    aiInstruction: "Help me complete this exact August challenge step. Keep the guidance practical and specific to the Relationship Manager / Personal CRM build, including contact memory, relationship notes, important dates, reminders, Gmail or Calendar connections, automations, proof of function, and the final community submission when relevant. Ask me for only the missing information you need, then give me the next concrete action.",
  },
};
const CLAUDE_DESKTOP_URL = "https://claude.com/download";
const GITHUB_URL = "https://github.com/";
const LOVABLE_URL = "https://lovable.dev/";
const MASTERY_REPLAYS_URL = "https://community.aiadvantage.com/c/mastery-replays/";
const JULY_RECORDINGS_URL = "https://community.aiadvantage.com/c/mastery-replays?topics=528891";
const MASTERY_CALENDAR_URL = "https://community.aiadvantage.com/c/mastery-calendar/";
const CHALLENGE_SUBMISSIONS_URL = "https://community.aiadvantage.com/c/challenge-submissions/";
const JULY_CHALLENGE_STATUS = {
  deadline: "Wednesday, July 29",
  prize: "AI Advantage Swag Box",
  submitUrl: CHALLENGE_SUBMISSIONS_URL,
};
const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const ACCESS_GATE_MODE = (import.meta.env.VITE_MASTERY_ACCESS_GATE || "off").toLowerCase();
const ACCESS_GATE_ENABLED = ACCESS_GATE_MODE !== "off" && ACCESS_GATE_MODE !== "public";
const ACCESS_GATE_ALLOWED_VALUES = (import.meta.env.VITE_MASTERY_ACCESS_ALLOWED_VALUES || "mastery,true,active,member,access")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const ACCESS_GATE_CLAIM_PATHS = (
  import.meta.env.VITE_MASTERY_ACCESS_CLAIM_PATHS ||
  "metadata.mastery_area,metadata.masteryAccess,public_metadata.mastery_area,public_metadata.masteryAccess,publicMetadata.mastery_area,publicMetadata.masteryAccess,mastery_area,masteryAccess,entitlements,roles"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const PAST_SYSTEMS = [
  {
    id: "m1",
    month: "January",
    date: "Jan 6, 2026",
    theme: "Personal",
    system: "Build Your Personal AI Advisory Board",
    tools: "Custom GPTs, ChatGPT",
    difficulty: "Beginner",
    summary: "Turn your DNA and decision history into a council of advisor personas inside a custom GPT.",
    igorComment: "If you'd rather do this in Claude, it's an easy switch. Just import the files and ask Claude to turn them into a skill.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-1-replay-build-your-personal-ai-advisory-board",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1?source=copy_link",
  },
  {
    id: "m2",
    month: "February",
    date: "Feb 3, 2026",
    theme: "Strategy",
    system: "Build Custom Business Tools",
    tools: "Lovable, ChatGPT, Google AI Studio",
    difficulty: "Beginner",
    summary: "Used your clone DNA and strategy prompts to build a hosted dashboard with charts and a chatbot.",
    igorComment: "This is my top recommendation for people just joining the program. This is a great way to learn an important tool: Lovable.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-2-replay-how-to-build-custom-business-tools-without-writing-a-single-line-of-code",
    resourceUrl: "https://aiadvantage.notion.site/Guide-2-DNA-to-Dashboard-2ed6426aaf6980038bb0fad729de8d87",
  },
  {
    id: "m3",
    month: "March",
    date: "Mar 3, 2026",
    theme: "Time",
    system: "Turn Your Expertise Into AI Workflows",
    tools: "ChatGPT, Google Sheets, Gemini, Lovable",
    difficulty: "Beginner",
    summary: "Teach AI your personal decision-making process.",
    igorComment: "It's also possible to build this kind of repeated generation in Cowork.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/march-strategy-amplifier-workshop",
    resourceUrl: "https://aiadvantage.notion.site/AI-Time-Tracker-Prompt-3196426aaf698024a6a3f72cb75494e6",
  },
  {
    id: "m4",
    month: "April",
    date: "Apr 7, 2026",
    theme: "Marketing",
    system: "Create Content, Visuals, and Marketing Assets With AI",
    tools: "Claude Cowork, ChatGPT, Notion, Zoom",
    difficulty: "Intermediate",
    summary: "Build a Claude marketing employee that can research, draft, and review content.",
    igorComment: "This is a great introduction to Claude Cowork.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/april-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1",
  },
  {
    id: "m5",
    month: "May",
    date: "May 7, 2026",
    theme: "Sales",
    system: "Automate Your Sales Follow-Ups",
    tools: "Claude Cowork, Zoom, Fathom, Fireflies, Granola",
    difficulty: "Advanced",
    summary: "Turn meeting transcripts into proposals, follow-up drafts, and a reusable workflow.",
    igorComment: "This workshop is a great way to see how deep plugins and meeting workflows can go.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/may-ai-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/Guide-5-From-Meeting-to-Proposal-34c6426aaf6980a4ba24dee6ad8e591a",
  },
  {
    id: "m6",
    month: "June",
    date: "Jun 4, 2026",
    theme: "Operations",
    system: "Build an AI Paperwork Assistant",
    tools: "Claude Cowork",
    difficulty: "Intermediate",
    summary: "Build a paperwork system that fills forms from a reusable profile and then improves itself.",
    igorComment: "This is a great way to learn how to build a self-improving system.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/june-mastery-replay",
    resourceUrl: "/monthly-resources/june",
  },
  {
    id: "m7",
    month: "July",
    date: "Jul 2, 2026",
    theme: "AI Hub",
    system: "Build Your Agents A Home",
    tools: "Claude Cowork, Lovable, GitHub",
    difficulty: "Advanced",
    summary: "Build a private AI Hub so outputs, ideas, wins, and tools live in one place.",
    igorComment: "This one includes multiple tools, but Lovable makes it simple to customize your hub once it's set up.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-july-2nd-replay",
    resourceUrl: "/monthly-resources/july",
  },
];

const TUTORIAL_QUICK_ACCESS = [
  {
    eyebrow: "Current Workshop",
    title: "Start with July",
    description: "This is the current workshop hub. Start here for prerequisites, guide, prompts, challenge, and follow-up resources.",
    url: "https://mastery.aiadvantage.com/monthly-resources/july",
    action: "Open current workshop",
  },
  {
    eyebrow: "Past Workshops",
    title: "Revisit previous months",
    description: "Use Past Workshops when you want June materials, June challenge links, or Igor's table on which older recordings to watch.",
    url: "https://mastery.aiadvantage.com/past-workshops",
    action: "Open past workshops",
  },
  {
    eyebrow: "AI Advantage Club",
    title: "Replays, events, and community live in the Club",
    description: "The Hub holds the materials. The AI Advantage Club is where you find replays, upcoming Mastery events, and the community conversation around the work.",
    url: MASTERY_REPLAYS_URL,
    action: "Open Mastery replays",
    secondaryUrl: MASTERY_CALENDAR_URL,
    secondaryAction: "Open upcoming events",
  },
];

const TUTORIAL_FAQS = [
  {
    question: "Where should I start if I just opened the site?",
    answer: "Start with [Current Workshop](https://mastery.aiadvantage.com/monthly-resources/july). It keeps the guide, prerequisites, live materials, challenge, and follow-up resources in one place so you are not hunting around.",
  },
  {
    question: "Where are the replays and upcoming live sessions?",
    answer: "Those live inside the [AI Advantage Club Mastery replays](https://community.aiadvantage.com/c/mastery-replays/) and the [Mastery calendar](https://community.aiadvantage.com/c/mastery-calendar/), not inside this Hub. Think of this site as your materials shelf. The Club is where the live rooms, replays, event posts, and community conversations happen.",
  },
  {
    question: "Where do I find the current challenge?",
    answer: "Go to [Current Workshop](https://mastery.aiadvantage.com/monthly-resources/july), then use the Challenge row. That page has the challenge, the submission path, and the link into the [Challenge Submissions](https://community.aiadvantage.com/c/challenge-submissions/) space.",
  },
  {
    question: "Where can I see past challenge submissions?",
    answer: "Use the [Challenge Submissions space](https://community.aiadvantage.com/c/challenge-submissions/) inside the AI Advantage Club. That is where member challenge posts live.",
  },
  {
    question: "Which old Mastery recordings should I watch first?",
    answer: "Use the Past Systems table at the bottom of [Past Workshops](https://mastery.aiadvantage.com/past-workshops). It shows the difficulty, what changed, and who I would recommend each old build for now.",
  },
  {
    question: "What if I am behind or missed last month?",
    answer: "Totally fine. Start with the [current workshop](https://mastery.aiadvantage.com/monthly-resources/july) first, then use [Past Workshops](https://mastery.aiadvantage.com/past-workshops) when you want context or examples. You do not need to perfectly finish every old piece before you can participate now.",
  },
];

const HOME_SEARCH_ITEMS = [
  {
    title: "Current Workshop",
    eyebrow: "Current",
    description: "July guide, prompts, challenge, FAQ, and follow-up resources.",
    path: "/monthly-resources/july",
    keywords: "current workshop resources july guide prompts challenge faq materials",
  },
  {
    title: "Before You Start",
    eyebrow: "July workshop",
    description: "Accounts, apps, and files to have ready before the July guide.",
    path: "/monthly-resources/july/prerequisites",
    keywords: "before you start checklist prerequisites github lovable claude desktop setup",
  },
  {
    title: "July Guide: Build Your AI Hub",
    eyebrow: "July workshop",
    description: "The full step-by-step guide for building the private AI Hub.",
    path: "/monthly-resources/july/guide",
    keywords: "july guide build ai hub lovable github claude cowork walkthrough",
  },
  {
    title: "Live Prompts",
    eyebrow: "July workshop",
    description: "Use these alongside the live workshop when you just need the prompts to follow each step.",
    path: "/monthly-resources/july/prompts",
    keywords: "live prompts claude cowork lovable setup daily briefing help prompts",
  },
  {
    title: "Go Deeper With Your AI Hub",
    eyebrow: "July extras",
    description: "Lock down access, publish cleanly, and extend the Hub with extra apps.",
    path: "/monthly-resources/july/extras",
    keywords: "extras publishing extra apps restrict access email agenthub builder project instructions prompt library",
  },
  {
    title: "Current Challenge",
    eyebrow: "Challenge",
    description: "Task, submission link, judging, voting, and showcase.",
    path: "/monthly-resources/july",
    keywords: "current challenge resources task submission link judging voting showcase paint your ai hub",
  },
  {
    title: "July Challenge: Paint your AI Hub",
    eyebrow: "Challenge",
    description: "Use what you built this month, submit your version, and see what other members made.",
    path: "/challenges/july/guide",
    keywords: "july challenge paint your ai hub mobile redesign design director submit prize",
  },
  {
    title: "Past Workshops",
    eyebrow: "Past month",
    description: "Previous workshop and challenge materials merged by month.",
    path: "/past-workshops",
    keywords: "june past workshop resources replay paperwork guide live materials challenge examples submissions past systems",
  },
  {
    title: "Past Systems Swipe File",
    eyebrow: "Past Workshops",
    description: "Concise guide to old Mastery builds, difficulty, recordings, and what Igor would recommend today.",
    path: "/past-workshops",
    scroll: "bottom",
    keywords: "past systems swipe file recordings difficulty beginner intermediate advanced mastery months",
  },
  {
    title: "June Guide",
    eyebrow: "Past month",
    description: "The Paperwork guide from June.",
    path: "/monthly-resources/june/guide",
    keywords: "june guide paperwork forms claude skill",
  },
  {
    title: "FAQ",
    eyebrow: "Quick access",
    description: "Use the shortcut page when you need the right place fast.",
    path: "/faq",
    keywords: "faq tutorial quick access shortcuts resources replays events challenge",
  },
];

function liveWorkshopSearchItem(liveWorkshop) {
  const month = liveWorkshop?.month || CURRENT_MONTH;
  const slug = liveWorkshop?.slug || CURRENT_WORKSHOP_SLUG;
  return {
    title: "Current Workshop",
    eyebrow: "Current",
    description: `${month.label} guide, prompts, challenge, and follow-up resources.`,
    path: `/monthly-resources/${slug}`,
    keywords: `current workshop resources ${month.label || ""} ${month.topic || ""} ${month.focus || ""} guide prompts challenge materials`.toLowerCase(),
  };
}

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
    label: "July prompts ready",
    detail: "Open the July Live Prompts page so the Lovable setup, Cowork connect, CLAUDE.md, Daily Briefing, and Help prompts are ready.",
    link: "/monthly-resources/july/prompts",
    linkLabel: "Open Prompts",
    internal: true,
  },
];

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

const JULY_EXTRAS_CONTENT = {
  video: {
    eyebrow: "Follow up resources",
    title: "Go Deeper With Your AI Agent Hub",
    intro:
      "If you already built your AI Agent Hub, this follow-up shows you how to turn it from a nice project into something you can actually use: publish it, protect it behind login, expand it with new cards, and personalize it over time.",
    src: JULY_EXTRAS_VIDEO_EMBED_URL,
    ariaLabel: "July AI Agent Hub follow-up video",
  },
  prompts: [
    {
      title: "Restrict Access to One Email",
      text: "Only allow this address: [YOUR-EMAIL@gmail.com]\nMake all pages inaccessible unless the user is logged in from a clean login screen.",
    },
    {
      title: "Agent Hub Project Instructions",
      text: AGENTHUB_PROJECT_INSTRUCTIONS_PROMPT,
    },
    {
      title: "Skill: AgentHub Builder",
      description:
        "Download this Claude skill and install it so Claude can add cards, prompt libraries, and AI tools to your hub without pasting the long builder prompt.",
      file: "/july/agenthub-builder.skill",
      filename: "agenthub-builder.skill",
      downloadLabel: "Download skill",
      summaryLabel: "Skill file",
    },
    {
      title: "Add a prompt library card to my hub",
      text: ADD_PROMPT_LIBRARY_CARD_PROMPT,
    },
  ],
};

function monthGuideTitle(month) {
  return `${month.label} Guide`;
}

function monthRecordingsTitle(month) {
  return `${month.label} Recordings`;
}


function getPath() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/monthly-hubs") return CURRENT_WORKSHOP_PATH;
  if (path === "/monthly-resources") return CURRENT_WORKSHOP_PATH;
  if (path === "/challenges") return CURRENT_WORKSHOP_PATH;
  if (path === "/challenges/july") return "/monthly-resources/july";
  if (path === "/monthly-resources/june") return "/past-workshops/june";
  if (path === "/challenges/june") return "/past-workshops/june";
  if (path === "/tutorial") return "/faq";
  if (path === "/challenge-archive") return "/past-workshops";
  if (path === "/submit") return CURRENT_WORKSHOP_PATH;
  return path;
}

function resolveCurrentWorkshopPath(path, liveSlug = CURRENT_WORKSHOP_SLUG) {
  const targetSlug = liveSlug || CURRENT_WORKSHOP_SLUG;
  if (path === CURRENT_WORKSHOP_PATH) return `/monthly-resources/${targetSlug}`;
  if (path.startsWith(`${CURRENT_WORKSHOP_PATH}/`)) {
    return path.replace(CURRENT_WORKSHOP_PATH, `/monthly-resources/${targetSlug}`);
  }
  return path;
}

function resolveCanonicalWorkshopPath(path) {
  if (!path.startsWith(`${CANONICAL_WORKSHOP_PREFIX}/`)) return path;

  const [, , year, slug, ...rest] = path.split("/");
  if (year !== WORKSHOP_YEAR || !slug) return path;
  const suffix = rest.length ? `/${rest.join("/")}` : "";
  const pastSystem = PAST_SYSTEMS.find((item) => monthSlugFromLabel(item.month) === slug);

  if (slug === CURRENT_WORKSHOP_SLUG) return `/monthly-resources/${slug}${suffix}`;
  if (pastSystem && !suffix) return `/past-workshops/${slug}`;
  if (slug === "june" && suffix) return `/monthly-resources/june${suffix}`;
  if (pastSystem && suffix) return `/past-workshops/${slug}`;
  return `/monthly-resources/${slug}${suffix}`;
}

function isRedirectTrackingSource(path) {
  return (
    path.startsWith("/monthly-resources/july/guide/") ||
    path.startsWith("/monthly-resources/june/guide/") ||
    path === "/challenges/june/submit" ||
    path === "/challenges/june/submissions"
  );
}

export default function App() {
  const [path, setPath] = useState(getPath);
  const [cmsMonths, setCmsMonths] = useState([]);
  const [liveMonthSlug, setLiveMonthSlug] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_ID);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissions, setSubmissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SUBMISSION_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const currentMonth = useMemo(
    () => MONTHS.find((month) => month.id === selectedMonth) || CURRENT_MONTH,
    [selectedMonth]
  );
  const liveWorkshop = useMemo(() => liveWorkshopFrom(cmsMonths, liveMonthSlug), [cmsMonths, liveMonthSlug]);
  const resolvedPath = resolveCanonicalWorkshopPath(path);
  useEffect(() => {
    function handlePopState() {
      setPath(getPath());
      window.scrollTo({ top: 0 });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isRedirectTrackingSource(path)) return;
    trackEvent("page_view", {
      metadata: {
        path,
      },
    });
  }, [path]);

  useEffect(() => {
    let cancelled = false;

    async function loadPublishedMonths() {
      try {
        const response = await fetch("/api/mastery-content");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setCmsMonths(data.months || []);
          setLiveMonthSlug(data.liveMonthSlug || "");
        }
      } catch {
        if (!cancelled) {
          setCmsMonths([]);
          setLiveMonthSlug("");
        }
      }
    }

    loadPublishedMonths();
    window.addEventListener("focus", loadPublishedMonths);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPublishedMonths);
    };
  }, []);

  function navigate(nextPath, options = {}) {
    const scrollToBottom = options.scroll === "bottom";
    if (nextPath === path && !scrollToBottom) return;
    if (nextPath !== path) {
      if (options.replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }
      setPath(nextPath);
    }
    const targetTop = () => (scrollToBottom ? document.documentElement.scrollHeight : 0);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: targetTop(), behavior: "smooth" });
      if (scrollToBottom) {
        window.setTimeout(() => window.scrollTo({ top: targetTop(), behavior: "smooth" }), 120);
      }
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submission = {
      id: crypto.randomUUID(),
      month: data.get("month"),
      member_name: data.get("memberName"),
      title: data.get("title"),
      share_link: data.get("shareLink"),
      notes: data.get("notes"),
      status: "Submitted for review",
      created_at: new Date().toISOString(),
    };

    setSubmissionStatus("Saving submission...");

    if (supabase) {
      const { error } = await supabase.from("mastery_challenge_submissions").insert(submission);
      if (error) {
        setSubmissionStatus("Your submission was saved. The team can review it from the latest queue.");
      } else {
        setSubmissionStatus("Submission received. Nice work.");
      }
    } else {
      setSubmissionStatus("Submission received. Nice work.");
    }

    const nextSubmissions = [submission, ...submissions].slice(0, 8);
    setSubmissions(nextSubmissions);
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(nextSubmissions));
    form.reset();
  }

  const isAuthPath = path === "/sign-in" || path === "/sign-up";
  const isLayoutLabPath = path === "/homepage-layouts";

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/")} aria-label="AI Mastery Resources home">
          <span className="brand-word">AI</span>
          <span className="brand-bolt" aria-hidden="true">⚡</span>
          <span className="brand-word brand-word-long">Mastery Resources</span>
        </button>

        <nav className="nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={item.path === "/"
                ? (path === "/" ? "active" : "")
                : item.currentWorkshop
                  ? (isCurrentWorkshopPath(path, liveWorkshop.slug) ? "active" : "")
                  : item.path === "/past-workshops"
                    ? (isPastWorkshopPath(path, liveWorkshop.slug) ? "active" : "")
                  : ((item.activePrefixes || [item.path]).some((prefix) => path.startsWith(prefix)) ? "active" : "")}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <AuthStatus navigate={navigate} />
      </header>
      {!isAuthPath && path !== "/" && <QuickNavRail navigate={navigate} />}

      <main>
        {isAuthPath && <AuthPage mode={path === "/sign-up" ? "signUp" : "signIn"} navigate={navigate} />}
        {!isAuthPath && (
          <AccessGate navigate={navigate}>
            {isLayoutLabPath && <HomepageLayoutLab navigate={navigate} />}
            {path === "/" && <HomePage navigate={navigate} cmsMonths={cmsMonths} />}
            {path === "/admin" && <AdminBackend navigate={navigate} />}
            {path === "/admin/full-preview" && <FullGuidePreviewPage navigate={navigate} />}
            {path === "/fundamentalsjuly" && <FundamentalsJulyPage />}
            {(resolvedPath.startsWith("/monthly-resources") || resolvedPath.startsWith(CURRENT_WORKSHOP_PATH)) && (
              <MonthlyResourcesPage
                currentMonth={currentMonth}
                path={resolveCurrentWorkshopPath(resolvedPath, liveWorkshop.slug)}
                navigate={navigate}
                cmsMonths={cmsMonths}
                liveMonthSlug={liveWorkshop.slug}
              />
            )}
            {path.startsWith("/challenges") && (
              <ChallengesPage
                handleSubmit={handleSubmit}
                path={path}
                navigate={navigate}
                submissionStatus={submissionStatus}
                submissions={submissions}
                cmsMonths={cmsMonths}
              />
            )}
            {resolvedPath.startsWith("/past-workshops") && <PastWorkshopsPage path={resolvedPath} navigate={navigate} cmsMonths={cmsMonths} />}
            {path === "/faq" && <TutorialPage navigate={navigate} />}
            {!isLayoutLabPath && path !== "/admin" && path !== "/admin/full-preview" && path !== "/fundamentalsjuly" && !resolvedPath.startsWith("/monthly-resources") && !resolvedPath.startsWith(CURRENT_WORKSHOP_PATH) && !resolvedPath.startsWith("/challenges") && !resolvedPath.startsWith("/past-workshops") && path !== "/faq" && !NAV_ITEMS.some((item) => item.path === path) && <HomePage navigate={navigate} cmsMonths={cmsMonths} />}
          </AccessGate>
        )}
      </main>
    </div>
  );
}

function AccessGate({ children, navigate }) {
  if (!ACCESS_GATE_ENABLED) return children;

  if (!HAS_CLERK) {
    return (
      <AccessGateShell
        title="Member access is not connected here yet."
        message="Clerk is required before the Mastery Hub can be locked. The production gate can be turned off instantly by setting VITE_MASTERY_ACCESS_GATE to off."
        actionLabel="Back to sign in"
        onAction={() => navigate("/sign-in")}
      />
    );
  }

  return <ClerkAccessGate navigate={navigate}>{children}</ClerkAccessGate>;
}

function ClerkAccessGate({ children, navigate }) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <AccessGateShell
        title="Checking your member access."
        message="One moment while Mastery Resources verifies your signed-in account."
      />
    );
  }

  if (!isSignedIn) {
    return (
      <AccessGateShell
        title="Sign in to Mastery Resources."
        message="Use the email or Google account connected to your AI Advantage community access."
        actionLabel="Sign in"
        onAction={() => navigate("/sign-in")}
      />
    );
  }

  if (hasMasteryAccess({ sessionClaims, user })) {
    return children;
  }

  return (
    <AccessGateShell
      title="Mastery access was not found."
      message="You are signed in, but this account does not show the Mastery access marker yet. If you should have access, use the community account connected to your Mastery membership."
      actionLabel="Try another account"
      onAction={() => navigate("/sign-in")}
    />
  );
}

function AccessGateShell({ title, message, actionLabel, onAction }) {
  return (
    <section className="access-gate-shell" aria-label="Mastery access gate">
      <div className="access-gate-panel">
        <p className="section-kicker">Private member platform</p>
        <h1>{title}</h1>
        <p>{message}</p>
        {actionLabel && (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function hasMasteryAccess({ sessionClaims, user }) {
  if (ACCESS_GATE_MODE === "signed-in" || ACCESS_GATE_MODE === "community") {
    return true;
  }

  const sources = [
    sessionClaims,
    sessionClaims?.metadata,
    sessionClaims?.public_metadata,
    user,
    user?.publicMetadata,
    user?.unsafeMetadata,
  ];

  return ACCESS_GATE_CLAIM_PATHS.some((path) =>
    sources.some((source) => valueGrantsAccess(readPath(source, path)))
  );
}

function readPath(source, path) {
  if (!source || !path) return undefined;

  return path.split(".").reduce((value, key) => {
    if (value == null) return undefined;
    if (Object.prototype.hasOwnProperty.call(value, key)) return value[key];
    return undefined;
  }, source);
}

function valueGrantsAccess(value) {
  if (value === true) return true;
  if (typeof value === "string") {
    return ACCESS_GATE_ALLOWED_VALUES.includes(value.trim().toLowerCase());
  }
  if (Array.isArray(value)) {
    return value.some(valueGrantsAccess);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(valueGrantsAccess);
  }
  return false;
}

function QuickNavRail({ navigate }) {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="quick-nav-rail" aria-label="Quick navigation">
      <button type="button" onClick={scrollToTop} aria-label="Back to top" title="Back to top">
        <span aria-hidden="true">↑</span>
      </button>
      <button type="button" onClick={() => navigate("/")} aria-label="Go home" title="Go home">
        <span aria-hidden="true">⌂</span>
      </button>
    </div>
  );
}

function AuthStatus({ navigate }) {
  if (!HAS_CLERK) {
    return (
      <span className="signin auth-local-status">
        <span className="status-dot status-dot-muted" />
        Local mode
      </span>
    );
  }

  return <ClerkAuthStatus navigate={navigate} />;
}

function ClerkAuthStatus({ navigate }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleSignOut() {
    setIsMenuOpen(false);
    await signOut({ redirectUrl: "/" });
  }

  if (isLoaded && isSignedIn) {
    return (
      <div className="member-menu">
        <span className="member-pill">
          <span className="status-dot" />
          Member access
        </span>
        <div className="account-menu" ref={menuRef}>
          <button
            className="account-trigger"
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" />
            ) : (
              <span>{user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "M"}</span>
            )}
          </button>
          {isMenuOpen && (
            <div className="account-dropdown" role="menu" aria-label="Account menu">
              <a
                href={MOD_HELP_URL}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                AIA Club
              </a>
              <button type="button" role="menuitem" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button className="signin" type="button" onClick={() => navigate("/sign-in")}>
      <span className="status-dot status-dot-muted" />
      Sign in
    </button>
  );
}

function AuthPage({ mode, navigate }) {
  const isSignUp = mode === "signUp";
  const [authStalled, setAuthStalled] = useState(false);

  useEffect(() => {
    setAuthStalled(false);
    const timer = window.setTimeout(() => {
      const hasClerkFields = Boolean(
        document.querySelector(".auth-panel input, .auth-panel [data-clerk-element]")
      );
      if (!hasClerkFields) setAuthStalled(true);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [mode]);

  return (
    <section className="auth-shell" aria-label="Mastery Resources member sign in">
      <div className="auth-copy">
        <p className="section-kicker">Private member platform</p>
        <h1>{isSignUp ? "Create your Mastery access." : "Sign in to Mastery Resources."}</h1>
        <p>
          Use the email or Google account connected to your AI Mastery access.
        </p>
        <div className="auth-switch">
          {isSignUp ? (
            <button type="button" onClick={() => navigate("/sign-in")}>Already have access? Sign in</button>
          ) : (
            <button type="button" onClick={() => navigate("/sign-up")}>Need access? Create account</button>
          )}
        </div>
      </div>
      <div className="auth-panel">
        {!HAS_CLERK && (
          <div className="auth-fallback" role="status">
            <span className="status-dot status-dot-muted" />
            <h2>Local development mode.</h2>
            <p>
              Add VITE_CLERK_PUBLISHABLE_KEY to connect sign-in locally. Public resource pages still render for development and QA.
            </p>
          </div>
        )}
        {HAS_CLERK && authStalled && (
          <div className="auth-fallback" role="status">
            <span className="status-dot status-dot-muted" />
            <h2>Member sign-in is not connected on this domain yet.</h2>
            <p>
              The hub is ready for member access, but the authentication provider needs to allow this live domain before the fields can appear.
            </p>
          </div>
        )}
        {HAS_CLERK && (
          isSignUp ? (
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/"
              appearance={clerkAppearance}
            />
          ) : (
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/"
              appearance={clerkSignInAppearance}
            />
          )
        )}
      </div>
    </section>
  );
}

const clerkAppearance = {
  variables: {
    colorPrimary: "#8f6929",
    colorText: "#312820",
    colorTextSecondary: "#76695d",
    colorBackground: "#fffdf8",
    colorInputBackground: "#fffdf8",
    colorInputText: "#312820",
    borderRadius: "8px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    cardBox: "clerk-card-box",
    card: "clerk-card",
    headerTitle: "clerk-title",
    headerSubtitle: "clerk-subtitle",
    formButtonPrimary: "clerk-primary-button",
  },
};

const clerkSignInAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    footerAction: { display: "none" },
  },
};

function HomePage({ navigate, cmsMonths = [] }) {
  const liveWorkshop = useMemo(() => liveWorkshopFrom(cmsMonths), [cmsMonths]);
  const liveMonth = liveWorkshop.month;
  const [mapGlow, setMapGlow] = useState({ x: 62, y: 34, active: false });
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const terms = query.split(/\s+/).filter(Boolean);
    const items = [
      liveWorkshopSearchItem(liveWorkshop),
      ...HOME_SEARCH_ITEMS,
    ];

    return items
      .map((item) => {
        const haystack = `${item.title} ${item.eyebrow} ${item.description} ${item.keywords}`.toLowerCase();
        const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 6);
  }, [searchQuery, liveWorkshop]);

  function handleMapMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMapGlow({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }

  function openDestination(destination, options = {}) {
    if (destination.startsWith("http")) {
      window.location.href = destination;
      return;
    }
    navigate(destination, options);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (searchResults[0]) openDestination(searchResults[0].path, { scroll: searchResults[0].scroll });
  }

  return (
    <>
      <section
        className={`hero command-hero ${mapGlow.active ? "map-active" : ""}`}
        style={{
          "--map-glow-x": `${mapGlow.x}%`,
          "--map-glow-y": `${mapGlow.y}%`,
        }}
        onPointerMove={handleMapMove}
        onPointerLeave={() => setMapGlow((current) => ({ ...current, active: false }))}
      >
        <div className="hero-bg" />
        <div className="map-glow" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-content">
            <p className="eyebrow">Private member platform</p>
            <h1>AI Mastery Workshop Resources</h1>
            <p className="hero-copy">
              Find any slide, prompt, or replay from a current or past Mastery workshop.
            </p>
            <form className="home-search" role="search" onSubmit={handleSearchSubmit}>
              <label className="sr-only" htmlFor="home-resource-search">Search Mastery resources</label>
              <div className="home-search-input-wrap">
                <input
                  id="home-resource-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search slides, prompts, replays, challenges..."
                  autoComplete="off"
                />
                <button type="submit" disabled={!searchResults.length}>Search</button>
              </div>
              {searchQuery.trim() && (
                <div className="home-search-results" role="listbox" aria-label="Search results">
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={`${item.title}-${item.path}`}
                        type="button"
                        role="option"
                        onClick={() => openDestination(item.path, { scroll: item.scroll })}
                      >
                        <span>{item.eyebrow}</span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </button>
                    ))
                  ) : (
                    <p>No matches yet. Try a resource name, month, or challenge.</p>
                  )}
                </div>
              )}
            </form>
          </div>
          <div className="hero-route-grid hero-route-grid-single" aria-label="Current workshop">
            <button
              type="button"
              className="hero-route-card"
              style={{ "--month-image": `url("${liveMonth.image?.src || MONTHS.find((month) => month.id === CURRENT_MONTH_ID)?.image?.src}")` }}
              onClick={() => navigate(CURRENT_WORKSHOP_PATH)}
            >
              <span className="hero-route-copy">
                <span>Current Workshop</span>
                <strong>{liveMonth.focus || liveMonth.image?.title || "Open the current workshop"}</strong>
                <small>Open the {liveMonth.label} guide, prompts, challenge, and follow-up resources.</small>
                <span className="hero-route-action">Open workshop</span>
              </span>
            </button>
          </div>
        </div>
      </section>
      <section className="home-resource-strip" aria-label="Mastery resource path">
        <button type="button" onClick={() => navigate(CURRENT_WORKSHOP_PATH)}>
          <span>Start here</span>
          <strong>Open the {liveMonth.label} guide, prompts, challenge, and follow-up resources.</strong>
        </button>
        <button type="button" onClick={() => navigate("/past-workshops")}>
          <span>Catch up</span>
          <strong>Browse older workshops without losing the current month.</strong>
        </button>
        <button type="button" onClick={() => navigate("/faq")}>
          <span>Get unstuck</span>
          <strong>Find quick answers for replays, access, submissions, and resources.</strong>
        </button>
      </section>
    </>
  );
}

function HomepageLayoutLab({ navigate }) {
  const layouts = [
    {
      id: "command",
      eyebrow: "Option 1",
      title: "Command Center",
      description: "Best if the homepage should feel like the member’s starting point. Clear actions first, current month second, visuals supporting the workflow.",
      className: "layout-command",
    },
    {
      id: "path",
      eyebrow: "Option 2",
      title: "Monthly Path",
      description: "Best if we want beginners to instantly understand the sequence: replay, guide, prompts, challenge. Very clear, very calm.",
      className: "layout-path",
    },
    {
      id: "showcase",
      eyebrow: "Option 3",
      title: "Visual Showcase",
      description: "Best if the homepage should feel more premium and visual. It leads with real screenshots and makes the Hub feel alive.",
      className: "layout-showcase",
    },
  ];

  return (
    <section className="layout-lab" aria-labelledby="layout-lab-title">
      <div className="layout-lab-head">
        <p className="section-kicker">Homepage layout lab</p>
        <h1 id="layout-lab-title">Three alternate homepage directions.</h1>
        <p>
          Same Warm Paper style, different structure. Pick the one that feels clearest for Mastery members.
        </p>
      </div>
      <div className="layout-lab-grid">
        {layouts.map((layout) => (
          <LayoutPreview key={layout.id} layout={layout} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}

function LayoutPreview({ layout, navigate }) {
  if (layout.id === "command") {
    return (
      <article className={`layout-preview ${layout.className}`}>
        <LayoutIntro layout={layout} />
        <div className="command-preview-grid">
          <div className="command-preview-main">
            <p className="section-kicker">Private member platform</p>
            <h2>Start with the right next step.</h2>
            <p>Current workshop, past workshops, and FAQ, organized around what to do next.</p>
            <div className="preview-actions">
              <button type="button" onClick={() => navigate("/monthly-resources/july")}>Open Current Workshop</button>
              <button type="button" onClick={() => navigate("/past-workshops")}>Open Past Workshops</button>
            </div>
          </div>
          <div className="command-preview-panel">
            <span>Current month</span>
            <strong>June: Paperwork</strong>
            <small>Replay, guide, session prompts, and challenge in one path.</small>
          </div>
        </div>
      </article>
    );
  }

  if (layout.id === "path") {
    const steps = ["Replay", "Guide", "Prompts", "Challenge"];

    return (
      <article className={`layout-preview ${layout.className}`}>
        <LayoutIntro layout={layout} />
        <div className="path-preview">
          <div>
            <p className="section-kicker">June</p>
            <h2>Your AI Handles the Paperwork</h2>
            <p>Follow the month in order. Watch the session, use the guide, copy the prompts, then submit the challenge.</p>
          </div>
          <div className="path-steps" aria-label="Monthly resource path">
            {steps.map((step, index) => (
              <div className="path-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`layout-preview ${layout.className}`}>
      <LayoutIntro layout={layout} />
      <div className="showcase-preview">
        <div className="showcase-copy">
          <p className="section-kicker">What members are building</p>
          <h2>Build the system once. Reuse it every time.</h2>
          <p>Real workflow visuals carry the homepage, with the main actions underneath instead of competing for attention.</p>
        </div>
        <div className="showcase-shots">
          {HOME_VISUALS.map((visual) => (
            <img key={visual.src} src={visual.src} alt="" loading="lazy" />
          ))}
        </div>
      </div>
    </article>
  );
}

function LayoutIntro({ layout }) {
  return (
    <div className="layout-intro">
      <span>{layout.eyebrow}</span>
      <h2>{layout.title}</h2>
      <p>{layout.description}</p>
    </div>
  );
}

function cmsMonthToMonth(month) {
  return {
    id: month.slug,
    label: month.label,
    number: month.month_number || month.label,
    topic: month.topic || "Mastery",
    status: "Live",
    available: true,
    focus: month.focus || `${month.label} Mastery Workshop`,
    outcome: month.outcome || "Open the guide, materials, extras, and challenge for this month.",
    image: {
      src: month.hero?.src || "/july/july-ai-hub-card-relatable-3.png",
      alt: month.hero?.alt || `${month.label} Mastery workshop`,
      kicker: month.hero?.kicker || "Published month",
      title: month.hero?.title || `${month.label}: ${month.topic || "Mastery"}`,
      caption: month.hero?.caption || "",
    },
    resources: month.resources || [],
  };
}

function monthSlug(month = {}) {
  return month.slug || String(month.label || "").toLowerCase();
}

function liveCmsMonth(cmsMonths = [], liveMonthSlug = "") {
  return cmsMonths.find((month) => month.is_current || month.slug === liveMonthSlug) || cmsMonths[0] || null;
}

function liveWorkshopFrom(cmsMonths = [], liveMonthSlug = "") {
  const cmsMonth = liveCmsMonth(cmsMonths, liveMonthSlug);
  if (cmsMonth) {
    return {
      slug: cmsMonth.slug,
      source: "cms",
      raw: cmsMonth,
      month: cmsMonthToMonth(cmsMonth),
    };
  }

  return {
    slug: CURRENT_WORKSHOP_SLUG,
    source: "static",
    raw: null,
    month: CURRENT_MONTH,
  };
}

function currentWorkshopUrl(cmsMonths = [], liveMonthSlug = "") {
  return `/monthly-resources/${liveWorkshopFrom(cmsMonths, liveMonthSlug).slug}`;
}

function isCurrentWorkshopPath(path, liveSlug = CURRENT_WORKSHOP_SLUG) {
  return path === CURRENT_WORKSHOP_PATH
    || path.startsWith(`${CURRENT_WORKSHOP_PATH}/`)
    || path === `/monthly-resources/${liveSlug}`
    || path.startsWith(`/monthly-resources/${liveSlug}/`)
    || path === `/challenges/${liveSlug}`
    || path.startsWith(`/challenges/${liveSlug}/`);
}

function isPastWorkshopPath(path, liveSlug = CURRENT_WORKSHOP_SLUG) {
  if (path.startsWith("/past-workshops")) return true;
  if (!path.startsWith("/monthly-resources/") && !path.startsWith("/challenges/")) return false;
  const slug = path.split("/")[2] || "";
  return Boolean(slug && slug !== liveSlug);
}

function cmsMonthToContent(month) {
  return {
    guide: month.guide_markdown || "",
    guideToc: {},
    challenge: month.challenge_markdown || "",
    challengePrompt: month.challenge_prompt || "",
    prompts: Array.isArray(month.prompts) ? month.prompts : [],
  };
}

function normalizedResourcePath(url = "") {
  try {
    return new URL(url, "https://mastery.aiadvantage.com").pathname.replace(/\/$/, "") || "/";
  } catch {
    return "";
  }
}

function standaloneResourcePage(month, path) {
  return (month?.resources || []).find((resource) => (
    (resource?.content_kind === "page" || resource?.content_ref === "page")
    && normalizedResourcePath(resource.url) === path
  ));
}

function cmsResourcePageContent(month, resource) {
  return {
    guide: resource?.content_markdown || "",
    guideToc: {},
    challenge: "",
    challengePrompt: "",
    prompts: Array.isArray(month?.prompts) ? month.prompts : [],
  };
}

function readFullPreviewPayload() {
  const params = new URLSearchParams(window.location.search);
  const previewId = params.get("preview");
  if (!previewId) return null;

  try {
    const storageKey = `${FULL_PREVIEW_STORAGE_PREFIX}${previewId}`;
    const payload = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!payload?.content?.guide) return null;
    if (payload.createdAt && Date.now() - payload.createdAt > 1000 * 60 * 60 * 8) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function FullGuidePreviewPage({ navigate }) {
  const payload = useMemo(() => readFullPreviewPayload(), []);

  if (!payload) {
    return (
      <MonthUnavailable
        basePath="/admin"
        label="preview"
        navigate={navigate}
        title="This preview is no longer available."
        message="Open Full Preview again from the admin editor to refresh the draft page."
      />
    );
  }

  const monthSlug = payload.monthSlug || "preview";
  const monthLabel = payload.monthLabel || "Preview";
  const previewMonth = {
    slug: monthSlug,
    label: monthLabel,
    topic: payload.monthTopic || "",
    focus: payload.monthFocus || "",
    outcome: payload.pageIntro || "",
  };
  const previewHelpContext = cmsGuideHelpContext(previewMonth);

  return (
      <GuidePage
        navigate={navigate}
        content={payload.content}
      monthLabel={monthLabel}
      monthSlug={monthSlug}
      pageTitle={payload.pageTitle || `${monthLabel} Guide`}
      pageIntro={payload.pageIntro || "Draft customer preview."}
      pageLabel={payload.pageLabel || "Guide"}
      showMaterials={false}
      customHelpContext={{
        ...previewHelpContext,
        guideName: payload.pageTitle || previewHelpContext.guideName,
        guideLink: `${window.location.origin}${payload.path || `/monthly-resources/${monthSlug}/guide`}`,
        }}
        isCurrentWorkshop={false}
        showGuideVideo={payload.showGuideVideo !== false}
      />
    );
  }

function cmsExtrasToContent(month) {
  const extras = month.extras || {};
  return {
    video: extras.video,
    prompts: Array.isArray(extras.prompts) ? extras.prompts : [],
  };
}

function cmsGuideHelpContext(month, type = "guide") {
  const isChallenge = type === "challenge";
  const override = isChallenge ? CHALLENGE_HELP_OVERRIDES[month.slug] : MONTH_HELP_OVERRIDES[month.slug];
  return {
    guideName: override?.guideName || `AI Mastery ${month.label} ${isChallenge ? "Challenge" : "guide"}`,
    guideLink: `https://mastery.aiadvantage.com/${isChallenge ? "challenges" : "monthly-resources"}/${month.slug}${isChallenge ? "/guide" : "/guide"}`,
    overallGoal: override?.overallGoal || month.outcome || month.focus || `Complete the ${month.label} Mastery month.`,
    aiInstruction: override?.aiInstruction || (isChallenge
      ? "Help me complete this exact challenge step. Ask me for only the missing information you need. Keep the instructions practical and specific to this month."
      : "Help me complete this exact guide step. Ask me for only the missing information you need. Keep the instructions practical and specific to this month."),
    monthSlug: month.slug,
    monthLabel: month.label,
    monthFocus: month.focus || month.topic || "",
  };
}

function cmsHasContent(month, key) {
  if (!month) return false;
  if (key === "guide") return Boolean(month.guide_markdown?.trim());
  if (key === "prompts") return Array.isArray(month.prompts) && month.prompts.length > 0;
  if (key === "extras") return Boolean(month.extras?.video?.src || month.extras?.video?.title || month.extras?.video?.intro || month.extras?.prompts?.length);
  if (key === "challenge") return Boolean(month.challenge_markdown?.trim());
  return false;
}

function MonthlyResourcesPage({ currentMonth, path, navigate, cmsMonths = [], liveMonthSlug = "" }) {
  const segment = path.split("/")[2] || "";
  const cmsMonth = cmsMonths.find((month) => month.slug === segment);
  const staticMonth = MONTHS.find((month) => month.label.toLowerCase() === segment);
  const currentSlug = liveMonthSlug || liveCmsMonth(cmsMonths)?.slug || CURRENT_WORKSHOP_SLUG;
  const isCurrentWorkshop = segment === currentSlug;

  if (path === "/monthly-resources") {
    return <RedirectRoute to={currentWorkshopUrl(cmsMonths, currentSlug)} navigate={navigate} />;
  }

  if (segment === "july" && path === "/monthly-resources/july/prerequisites") {
    return <JulyPrerequisitesPage navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
  }

  if (segment === "july" && path === "/monthly-resources/july/challenge-submissions") {
    return <ChallengeSubmissionRegistryPage archive={JULY_CHALLENGE_ARCHIVE} navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
  }

  if (segment === "july" && path === "/monthly-resources/july/faq-catchup") {
    return <JulyFaqCatchupPage navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
  }

  if (cmsMonth) {
    const resourcePage = standaloneResourcePage(cmsMonth, path);
    if (resourcePage) {
      if (!resourcePage.content_markdown?.trim()) {
        return (
          <MonthUnavailable
            basePath="/monthly-resources"
            label={segment}
            navigate={navigate}
            title="This page is not live yet."
            message="The card is published, but its page content has not been added yet."
          />
        );
      }
      return (
        <GuidePage
          navigate={navigate}
          content={cmsResourcePageContent(cmsMonth, resourcePage)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle={resourcePage.title || `${cmsMonth.label} Workshop Page`}
          pageIntro={resourcePage.description || "Follow this page for the workshop."}
          pageLabel={resourcePage.title || "Workshop Page"}
          showMaterials={false}
          customHelpContext={{
            ...cmsGuideHelpContext(cmsMonth),
            guideName: resourcePage.title || `${cmsMonth.label} workshop page`,
            guideLink: `https://mastery.aiadvantage.com${normalizedResourcePath(resourcePage.url)}`,
          }}
          isCurrentWorkshop={isCurrentWorkshop}
          showGuideVideo={false}
        />
      );
    }

    if (path === `/monthly-resources/${segment}/guide` || path.startsWith(`/monthly-resources/${segment}/guide/`)) {
      if (!cmsHasContent(cmsMonth, "guide")) {
        return (
          <MonthUnavailable
            basePath="/monthly-resources"
            label={segment}
            navigate={navigate}
            title="This guide is not live yet."
            message="The month is open, but this guide has not been published inside the month."
          />
        );
      }
      return (
        <GuidePage
          navigate={navigate}
          content={cmsMonthToContent(cmsMonth)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle={`${cmsMonth.label} Guide: ${cmsMonth.focus || cmsMonth.topic || "Mastery Workshop"}`}
          pageIntro={cmsMonth.outcome || "Follow the written guide for this month."}
          showMaterials={false}
          customHelpContext={cmsGuideHelpContext(cmsMonth)}
          isCurrentWorkshop={isCurrentWorkshop}
        />
      );
    }

    if (path === `/monthly-resources/${segment}/prompts`) {
      if (!cmsHasContent(cmsMonth, "prompts")) {
        return (
          <MonthUnavailable
            basePath="/monthly-resources"
            label={segment}
            navigate={navigate}
            title="These prompts are not live yet."
            message="The month is open, but this prompt page has not been published inside the month."
          />
        );
      }
      return (
        <SessionPromptsPage
          navigate={navigate}
          content={cmsMonthToContent(cmsMonth)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle="Live Prompts"
          lead="Use these alongside the live workshop when you just need the prompts to follow each step."
          showMaterials={false}
          breadcrumbLabel="Prompts"
          sectionLabel="Copy-paste"
          isCurrentWorkshop={isCurrentWorkshop}
        />
      );
    }

    if (path === `/monthly-resources/${segment}/extras`) {
      if (!cmsHasContent(cmsMonth, "extras")) {
        return (
          <MonthUnavailable
            basePath="/monthly-resources"
            label={segment}
            navigate={navigate}
            title="These extras are not live yet."
            message="The month is open, but this extras page has not been published inside the month."
          />
        );
      }
      return (
        <SessionPromptsPage
          navigate={navigate}
          content={cmsExtrasToContent(cmsMonth)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle={cmsMonth.extras?.video?.title || "Go Deeper"}
          lead={cmsMonth.extras?.video?.intro || "Use these optional follow-up resources after the main workshop guide."}
          breadcrumbLabel="Go Deeper"
          sectionLabel={cmsMonth.extras?.video?.eyebrow || "Follow up resources"}
          showMaterials={false}
          isCurrentWorkshop={isCurrentWorkshop}
        />
      );
    }

    return <CmsResourcesMenu month={cmsMonth} navigate={navigate} isPast={!isCurrentWorkshop} />;
  }

  if (path === "/monthly-resources/july/guide") {
    return (
      <GuidePage
        navigate={navigate}
        content={JULY_CONTENT}
        monthLabel="July"
        monthSlug="july"
        pageTitle="July Guide: Build Your AI Hub"
        pageIntro="Build your own private AI Hub website where everything your AI creates shows up, with Lovable, GitHub, and Claude Cowork wired together."
        showMaterials={false}
        isCurrentWorkshop={isCurrentWorkshop}
      />
    );
  }

  if (path === "/monthly-resources/july/prerequisites") {
    return <JulyPrerequisitesPage navigate={navigate} />;
  }

  if (path.startsWith("/monthly-resources/july/guide/")) {
    return <RedirectRoute to="/monthly-resources/july/guide" navigate={navigate} />;
  }

  if (path === "/monthly-resources/july/challenge-submissions") {
    return <ChallengeSubmissionRegistryPage archive={JULY_CHALLENGE_ARCHIVE} navigate={navigate} />;
  }

  if (path === "/monthly-resources/july/prompts") {
    return (
      <SessionPromptsPage
        navigate={navigate}
        content={JULY_CONTENT}
        monthLabel="July"
        monthSlug="july"
        pageTitle="Live Prompts"
        lead="Use these alongside the live workshop when you just need the prompts to follow each step."
        breadcrumbLabel="Prompts"
        sectionLabel="Copy-paste"
        showMaterials={false}
        isCurrentWorkshop={isCurrentWorkshop}
      />
    );
  }

  if (path === "/monthly-resources/july/extras") {
    return (
      <SessionPromptsPage
        navigate={navigate}
        content={JULY_EXTRAS_CONTENT}
        monthLabel="July"
        monthSlug="july"
        pageTitle="Go Deeper With Your AI Hub"
        lead="Use these prompts when you are ready to lock down access, publish cleanly, and extend the Hub with extra apps."
        breadcrumbLabel="Go Deeper"
        sectionLabel="Follow up resources"
        showMaterials={false}
        isCurrentWorkshop={isCurrentWorkshop}
      />
    );
  }

  if (path === "/monthly-resources/july/faq-catchup") {
    return <JulyFaqCatchupPage navigate={navigate} />;
  }

  if (path === "/monthly-resources/june/guide") {
    return <GuidePage navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
  }

  if (path.startsWith("/monthly-resources/june/guide/")) {
    return <RedirectRoute to="/monthly-resources/june/guide" navigate={navigate} />;
  }

  if (path === "/monthly-resources/june/prompts") {
    return <SessionPromptsPage navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
  }

  if (!staticMonth) {
    return (
      <MonthUnavailable
        basePath="/monthly-resources"
        label={segment}
        navigate={navigate}
        title="This month is not live yet."
        message="Choose a current or published month from Monthly Resources."
      />
    );
  }

  return <MonthResourcesMenu month={staticMonth || currentMonth} segment={segment} navigate={navigate} />;
}

function MonthUnavailable({ basePath, label, navigate, title, message }) {
  const cleanLabel = label ? label.replace(/-/g, " ") : "month";
  return (
    <section className="section page-section challenge-section">
      <Breadcrumbs items={[{ label: basePath === "/challenges" ? "Challenges" : "Monthly Resources", path: basePath }, { label: cleanLabel }]} navigate={navigate} />
      <div className="section-heading">
        <p className="section-kicker">Not live</p>
        <h1 className="page-title">{title}</h1>
        <p className="muted">{message}</p>
        <button type="button" onClick={() => navigate(basePath)}>Choose a month</button>
      </div>
    </section>
  );
}

function CmsMonthGroup({ months = [], basePath, navigate }) {
  const standaloneMonths = months.filter((month) => !MONTHS.some((item) => item.label.toLowerCase() === month.slug));
  if (!standaloneMonths.length) return null;
  return (
    <div className="month-choice-group cms-month-group">
      <h2 className="month-choice-group-title">Published admin months</h2>
      <div className="month-choice-grid" aria-label="Published admin months">
        {standaloneMonths.map((month) => (
          <button
            key={`${basePath}-${month.slug}`}
            type="button"
            className="month-choice has-image"
            onClick={() => navigate(`${basePath}/${month.slug}`)}
          >
            {month.hero?.src && <img className="month-choice-image" src={month.hero.src} alt="" loading="lazy" />}
            <span>{month.label}</span>
            <small>{month.topic || month.focus}</small>
            <strong>Live</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function normalizedResourceCategory(category) {
  if (category === "Extras" || category === "Follow up resources") return "Other";
  if (category === "Coming next" || category === "Coming Next") return "Next month";
  return ["Workshop", "Challenge", "Other", "Next month"].includes(category) ? category : "Other";
}

function resourceCategoryLabel(category) {
  if (category === "Other") return "Follow up resources";
  if (category === "Next month") return "Coming next";
  return category;
}

const MONTH_QUICK_ACCESS = [
  {
    label: "Replays",
    matches: (item, text) => /\breplay|\brecording/.test(text) || /mastery-replays/.test(item.url || ""),
  },
  {
    label: "Guide",
    matches: (item, text) => /\bguide|\bwalkthrough|\bresources?\b/.test(text) || /\/guide(?:\/|$|\?)/.test(item.url || ""),
  },
  {
    label: "Prompts",
    matches: (item, text) => /\bprompts?\b|\bcopy-paste\b/.test(text) || /\/prompts(?:\/|$|\?)/.test(item.url || ""),
  },
  {
    label: "FAQ",
    matches: (item, text) => /\bfaq\b|\bcatchup\b/.test(text) || /\/faq(?:[-/]|$|\?)/.test(item.url || ""),
  },
  {
    label: "Challenge",
    matches: (item, text) => /\bchallenge\b/.test(text) || /\/challenges(?:\/|$|\?)/.test(item.url || ""),
  },
];

function monthQuickAccessLinks(resources = [], navigate) {
  return MONTH_QUICK_ACCESS.flatMap(({ label, matches }) => {
    const item = resources.find((resource) => {
      if (!resource?.url) return false;
      const text = `${resource.category || ""} ${resource.type || ""} ${resource.title || ""}`.toLowerCase();
      return matches(resource, text);
    });
    if (!item) return [];
    return /^https?:\/\//.test(item.url)
      ? [{ label, href: item.url }]
      : [{ label, onClick: () => navigate(item.url) }];
  });
}

function isChallengeGuideResource(item = {}) {
  const category = normalizedResourceCategory(item.category);
  const haystack = `${item.type || ""} ${item.title || ""} ${item.url || ""}`.toLowerCase();
  if (category !== "Challenge") return false;
  if (/submissions?|submit/.test(haystack)) return false;
  return true;
}

function publicMonthResourceCards(month = {}) {
  const cards = Array.isArray(month.resources) ? month.resources.filter((item) => item?.title) : [];
  const normalizedCards = cards.map((item) => {
    if (!isChallengeGuideResource(item)) return item;
    return {
      ...item,
      type: "Challenge",
      title: "Challenge Guide",
      description: item.description || "Read the mission, steps, deliverables, and working prompt for this month.",
      url: `/challenges/${month.slug}/guide`,
    };
  });

  const hasChallengeGuide = normalizedCards.some(isChallengeGuideResource);
  const hasClubSubmitCard = normalizedCards.some((item) => {
    const category = normalizedResourceCategory(item.category);
    const haystack = `${item.type || ""} ${item.title || ""} ${item.url || ""}`.toLowerCase();
    return category === "Challenge" && (/submit/.test(haystack) || item.url === CHALLENGE_SUBMISSIONS_URL);
  });

  if (hasChallengeGuide && !hasClubSubmitCard) {
    normalizedCards.push({
      category: "Challenge",
      type: "Submit",
      title: "Submit in the Club",
      description: "Share your work in the Challenge Submissions space when you are ready.",
      url: CHALLENGE_SUBMISSIONS_URL,
    });
  }

  return normalizedCards;
}

function CmsResourcesMenu({ month, navigate, isPast = false }) {
  const displayMonth = cmsMonthToMonth(month);
  const hasGuide = cmsHasContent(month, "guide");
  const hasPrompts = cmsHasContent(month, "prompts");
  const hasExtras = cmsHasContent(month, "extras");
  const resourceCards = publicMonthResourceCards(month);
  const quickAccessLinks = monthQuickAccessLinks(resourceCards, navigate);
  const groupedResources = resourceCards.reduce((groups, item) => {
    const category = normalizedResourceCategory(item.category);
    groups[category] = [...(groups[category] || []), item];
    return groups;
  }, {});
  const categoryOrder = ["Workshop", "Challenge", "Other", "Next month", ...Object.keys(groupedResources).filter((category) => !["Workshop", "Challenge", "Other", "Next month"].includes(category))];

  function openResource(item) {
    if (!item.url) return;
    if (/^https?:\/\//.test(item.url)) {
      window.location.href = item.url;
      return;
    }
    navigate(item.url);
  }

  return (
    <section className="section page-section month-section" aria-label={`${month.label} resources`}>
      <Breadcrumbs
        items={isPast
          ? [
              { label: "Past Workshops", path: "/past-workshops" },
              { label: month.label },
            ]
          : [{ label: "Current Workshop" }]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={displayMonth}
        actionLinks={quickAccessLinks}
        variant="banner"
      />
      {resourceCards.length > 0 ? (
        <div className="resource-category-stack">
          {categoryOrder.filter((category) => groupedResources[category]?.length).map((category) => (
            <section className="resource-category" key={category}>
              <div className="resource-category-head">
                <h3>{resourceCategoryLabel(category)}</h3>
              </div>
              <div className={`resource-grid ${groupedResources[category].length === 2 ? "resource-grid-two" : groupedResources[category].length >= 3 ? "resource-grid-three" : ""}`}>
                {groupedResources[category].map((item, index) => (
                  <button
                    className="resource-card resource-card-button"
                    type="button"
                    key={`${category}-${item.title}-${index}`}
                    disabled={!item.url}
                    onClick={() => openResource(item)}
                  >
                    <div className="resource-card-top">
                      <span>{item.type || "Resource"}</span>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.description || "Open this month's resource."}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : hasGuide || hasPrompts || hasExtras ? (
        <div className="resource-grid resource-grid-three">
          <button className="resource-card resource-card-button" type="button" disabled={!hasGuide} onClick={() => navigate(`/monthly-resources/${month.slug}/guide`)}>
            <div className="resource-card-top">
              <span>Guide</span>
            </div>
            <h4>{month.label} Guide</h4>
            <p>{month.outcome || "Open the main written guide for this month."}</p>
          </button>
          <button className="resource-card resource-card-button" type="button" disabled={!hasPrompts} onClick={() => navigate(`/monthly-resources/${month.slug}/prompts`)}>
            <div className="resource-card-top">
              <span>Live prompts</span>
            </div>
            <h4>Live Prompts</h4>
            <p>Copy the prompts that support this month's guide.</p>
          </button>
          <button className="resource-card resource-card-button" type="button" disabled={!hasExtras} onClick={() => navigate(`/monthly-resources/${month.slug}/extras`)}>
            <div className="resource-card-top">
              <span>Extras</span>
            </div>
            <h4>Extras</h4>
            <p>Open optional follow-up resources, extra prompts, and supporting material.</p>
          </button>
        </div>
      ) : (
        <div className="admin-empty">
          <h2>Resources are being prepared.</h2>
          <p>The month is open, but the team has not published the first page inside it yet.</p>
        </div>
      )}
    </section>
  );
}

function MonthResourcesMenu({ month, segment, navigate }) {
  if (segment === "july") {
    return <JulyResourcesMenu month={month} navigate={navigate} />;
  }

  if (segment !== "june") {
    return <UpcomingMonth month={month} navigate={navigate} />;
  }

  const guideTitle = monthGuideTitle(month);
  const recordingsTitle = monthRecordingsTitle(month);

  return (
    <section className="section page-section month-section" aria-label={`${month.label} paperwork resources`}>
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "June" },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={month}
        actionLabel="Open the Guide"
        onAction={() => navigate("/monthly-resources/june/guide")}
      />
      <div className="resource-grid resource-grid-wide">
        <a className="resource-card resource-card-link" href={MONTH6_CONTENT.replayUrl} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Replay</span>
          </div>
          <h4>{recordingsTitle}</h4>
          <p>Watch the live session replay before or during the guide walkthrough.</p>
        </a>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/june/guide")}>
          <div className="resource-card-top">
            <span>Guide</span>
          </div>
          <h4>{guideTitle}</h4>
          <p>Open the full step-by-step guide with screenshots and the materials download.</p>
        </button>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/june/prompts")}>
          <div className="resource-card-top">
            <span>Live materials</span>
          </div>
          <h4>Live Materials</h4>
          <p>Copy the prompts for following along with the replay and running the workflow.</p>
        </button>
        <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Challenge examples</span>
          </div>
          <h4>June Challenge Submissions</h4>
          <p>Browse the community submissions and borrow ideas from what members built.</p>
        </a>
      </div>
    </section>
  );
}

function JulyResourcesMenu({ month, navigate }) {
  const guideTitle = monthGuideTitle(month);

  return (
    <section className="section page-section month-section" aria-label="July resources">
      <Breadcrumbs
        items={[
          { label: "Past Workshops", path: "/past-workshops" },
          { label: "July" },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={JULY_RESOURCE_BANNER}
        actionLinks={[
          { label: "Replays", href: PAST_SYSTEMS.find((item) => item.id === "m7")?.replayUrl },
          { label: "Guide", onClick: () => navigate("/monthly-resources/july/guide") },
          { label: "Prompts", onClick: () => navigate("/monthly-resources/july/prompts") },
          { label: "FAQ", onClick: () => navigate("/monthly-resources/july/faq-catchup") },
          { label: "Challenge", onClick: () => navigate("/challenges/july/guide") },
        ]}
        variant="banner"
      />
      <div className="resource-category-stack">
        <section className="resource-category" aria-labelledby="july-workshop-title">
          <div className="resource-category-head">
            <h3 id="july-workshop-title">Workshop</h3>
          </div>
          <div className="resource-grid resource-grid-three">
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/prerequisites")}>
              <div className="resource-card-top">
                <span>Checklist</span>
                <small>Prep</small>
              </div>
              <h4>Before You Start</h4>
              <p>Make sure the accounts, apps, and files you need for the July workshop are ready.</p>
            </button>
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/guide")}>
              <div className="resource-card-top">
                <span>Walkthrough</span>
                <small>Build</small>
              </div>
              <h4>{guideTitle}</h4>
              <p>Follow the full walkthrough to build your Hub and connect the main pieces.</p>
            </button>
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/prompts")}>
              <div className="resource-card-top">
                <span>Copy-paste</span>
                <small>Live</small>
              </div>
              <h4>Live Prompts</h4>
              <p>Use these alongside the live workshop when you just need the prompts to follow each step.</p>
            </button>
          </div>
        </section>

        <section className="resource-category" aria-labelledby="july-challenge-category-title">
          <div className="resource-category-head">
            <h3 id="july-challenge-category-title">Challenge</h3>
          </div>
          <div className="resource-grid resource-grid-two">
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/july/guide")}>
              <div className="resource-card-top">
                <span>Challenge</span>
              </div>
              <h4>July Challenge</h4>
              <p>Read the full mission, rules, deliverables, deadline, and the Design Director prompt.</p>
            </button>
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/challenge-submissions")}>
              <div className="resource-card-top">
                <span>Submissions</span>
                <small>Registry</small>
              </div>
              <h4>Challenge Submission Registry</h4>
              <p>Browse the July challenge submissions with summaries, visual previews, and filters.</p>
            </button>
          </div>
        </section>

        <section className="resource-category" aria-labelledby="july-extras-title">
          <div className="resource-category-head">
            <h3 id="july-extras-title">Follow up resources</h3>
          </div>
          <div className="resource-grid resource-grid-two">
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/extras")}>
              <div className="resource-card-top">
                <span>Video + Prompts</span>
                <small>Level up</small>
              </div>
              <h4>Go Deeper With Your AI Hub</h4>
              <p>Start here when you are ready to lock access to your email, publish, and build extra Hub apps.</p>
            </button>
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/faq-catchup")}>
              <div className="resource-card-top">
                <span>FAQ</span>
                <small>Catchup</small>
              </div>
              <h4>FAQ & Catchup</h4>
              <p>Review the July 16 catch-up answers, next steps, and prompts from Dirk's resource hub.</p>
            </button>
          </div>
        </section>

        <section className="resource-category" aria-labelledby="next-month-title">
          <div className="resource-category-head">
            <h3 id="next-month-title">Next month</h3>
          </div>
          <div className="resource-grid">
            <a className="resource-card resource-card-link" href={MONTHS.find((item) => item.id === "aug")?.calendarUrl || MASTERY_CALENDAR_URL} target="_blank" rel="noreferrer">
              <div className="resource-card-top">
                <span>August</span>
                <small>Event</small>
              </div>
              <h4>August Mastery Workshop</h4>
              <p>Open the August workshop event in the AI Advantage Club calendar.</p>
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}

function JulyFaqCatchupPage({ navigate, isCurrentWorkshop = false }) {
  return (
    <section className="section page-section month-section faq-catchup-page" aria-labelledby="july-catchup-title">
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel: "July", monthSlug: "july", leafLabel: "FAQ & Catchup" })}
        navigate={navigate}
      />
      <section className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">{JULY_CATCHUP_FAQ.eyebrow}</p>
            <h1 id="july-catchup-title" className="page-title">{JULY_CATCHUP_FAQ.title}</h1>
            <p>{JULY_CATCHUP_FAQ.intro}</p>
          </div>
          <button type="button" onClick={() => navigate("/monthly-resources/july/extras")}>
            Open follow up resources
          </button>
        </div>
        {JULY_CATCHUP_FAQ.heroImage && (
          <figure className="faq-catchup-hero">
            <img src={JULY_CATCHUP_FAQ.heroImage.src} alt={JULY_CATCHUP_FAQ.heroImage.alt} />
          </figure>
        )}

        {JULY_CATCHUP_FAQ.quickStart && (
          <aside className="faq-catchup-quickstart" aria-label={JULY_CATCHUP_FAQ.quickStart.title}>
            <div>
              <p className="section-kicker">{JULY_CATCHUP_FAQ.quickStart.kicker}</p>
              <h2>{JULY_CATCHUP_FAQ.quickStart.title}</h2>
              {JULY_CATCHUP_FAQ.quickStart.intro && <p>{JULY_CATCHUP_FAQ.quickStart.intro}</p>}
            </div>
            <ol>
              {JULY_CATCHUP_FAQ.quickStart.items.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </aside>
        )}

        <div className="faq-catchup-grid">
          {JULY_CATCHUP_FAQ.sections.map((item, index) => (
            <details className="faq-catchup-card" key={item.title} open={index < 3}>
              <summary>
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
              </summary>
              <div className="faq-catchup-body">
                {item.visuals?.length > 0 && (
                  <div className="faq-catchup-visuals">
                    {item.visuals.map((visual) => (
                      <figure key={visual.src}>
                        <img src={visual.src} alt={visual.alt} loading="lazy" />
                        {visual.caption && <figcaption>{visual.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
                {item.answer.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {item.checklist?.length > 0 && (
                  <div className="faq-catchup-list">
                    <h4>{item.checklistTitle || "Checklist"}</h4>
                    <ul>
                      {item.checklist.map((step) => <li key={step}>{step}</li>)}
                    </ul>
                  </div>
                )}
                {item.prompt && (
                  <div className="faq-catchup-prompt">
                    <div className="faq-catchup-prompt-head">
                      <h4>{item.promptTitle || "Prompt"}</h4>
                      <button type="button" onClick={() => copyText(item.prompt)}>Copy prompt</button>
                    </div>
                    <pre>{item.prompt}</pre>
                  </div>
                )}
                {item.link && (
                  <a className="faq-catchup-link" href={item.link.url} target="_blank" rel="noreferrer">
                    {item.link.label}
                  </a>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}

function ChallengeStatusStrip({ deadline, prize, submitUrl = CHALLENGE_SUBMISSIONS_URL }) {
  if (!deadline && !prize) return null;

  return (
    <div className="challenge-status-strip" aria-label="Challenge status">
      <div className="challenge-status-item">
        <span>Due</span>
        <strong>{deadline}</strong>
      </div>
      <div className="challenge-status-item">
        <span>Prize</span>
        <strong>{prize}</strong>
      </div>
      <a className="challenge-status-submit" href={submitUrl} target="_blank" rel="noreferrer">
        Submit your entry
      </a>
    </div>
  );
}

function challengeStatusFromMarkdown(content = "") {
  function field(names) {
    const heading = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const match = content.match(new RegExp(`^#{2,3}\\s+(?:${heading})\\s*\\n+([^\\n]+)`, "im"));
    return match?.[1]
      ?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/^The winner gets(?: an?)?\s+/i, "")
      .replace(/[.]+$/, "")
      .trim() || "";
  }

  return {
    deadline: field(["Deadline"]),
    prize: field(["Prize", "Prizes"]),
    submitUrl: CHALLENGE_SUBMISSIONS_URL,
  };
}

function MonthVisualCard({
  month = CURRENT_MONTH,
  actionLabel,
  actionLinks = [],
  onAction,
  variant = "",
}) {
  const image = month.image || CURRENT_MONTH.image;
  const className = ["month-visual-card", variant === "banner" ? "month-visual-card-banner" : ""]
    .filter(Boolean)
    .join(" ");
  const showImageCaption = variant !== "banner";

  return (
    <article className={className} aria-label={`${month.label} month visual card`}>
      <div className="month-visual-copy">
        <p className="section-kicker">{month.number}</p>
        <h3>{month.focus}</h3>
        <p>
          {month.outcome}
        </p>
        {actionLinks.length > 0 && (
          <div className="month-quicklinks" aria-label={`${month.label} quick links`}>
            {actionLinks.map((link) => (
              link.href ? (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ) : (
                <button key={link.label} type="button" onClick={link.onClick}>
                  {link.label}
                </button>
              )
            ))}
          </div>
        )}
        {actionLabel && actionLinks.length === 0 && (
          <button type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      <figure className="month-image-panel">
        <img src={image.src} alt={image.alt} loading="lazy" />
        {showImageCaption && (
          <figcaption>
            <span>{image.kicker}</span>
            <strong>{image.title}</strong>
            {image.caption && <small>{image.caption}</small>}
          </figcaption>
        )}
      </figure>
    </article>
  );
}

function GuidePage({
  navigate,
  content = MONTH6_CONTENT,
  monthLabel = "June",
  monthSlug = "june",
  pageTitle = "June Guide: Fill Any Form with Claude",
  pageIntro = "Build a paperwork system that fills forms from your DNA, shows what is missing, and gets smarter every time you run it.",
  pageLabel = "Guide",
  showMaterials = true,
  showGuideVideo = true,
  customHelpContext,
  isCurrentWorkshop = false,
}) {
  const guide = useMemo(() => getGuideModel(content.guide), [content]);
  const helpContext = customHelpContext || GUIDE_HELP_CONTEXTS[monthSlug] || GUIDE_HELP_CONTEXTS.june;
  const guideVideo = showGuideVideo ? content.guideVideo || GUIDE_VIDEO_BY_MONTH[monthSlug] : null;

  return (
    <section className="section page-section month-section guide-page-section" aria-labelledby="guide-title">
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel, monthSlug, leafLabel: pageLabel })}
        navigate={navigate}
      />
      <div className="guide-page-layout">
      <GuideTableOfContents guide={guide} config={content.guideToc} />
      <section className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Guide</p>
            <h1 id="guide-title" className="page-title">{pageTitle}</h1>
            <p>{pageIntro}</p>
          </div>
          {showMaterials && content.materialsUrl && (
            <LinkButton href={content.materialsUrl}>Download Materials</LinkButton>
          )}
      </div>
      <div className="workbench-layout">
        <div className="workbench-stack">
          {guideVideo && (
            <article className="workbench-step guide-video-card" id="video-guide">
              <div className="workbench-step-top">
                <span>Video Guide</span>
              </div>
              <h3>Video Guide</h3>
              <p className="workbench-step-subtitle">
                {guideVideo.description}
              </p>
              <div className="video-embed" aria-label={guideVideo.ariaLabel}>
                <iframe
                  title={guideVideo.title}
                  src={guideVideo.embedUrl}
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </article>
          )}
          {!guide.introSections.length && !guide.steps.length && !guide.closingSections.length && (
            <GenericGuideCards content={content.guide || ""} />
          )}
          {guide.introSections.map((section) => (
            <IntroSectionCard section={section} monthSlug={monthSlug} navigate={navigate} key={section.title} />
          ))}
          {guide.steps.map((step, index) => {
            const leadBlocks = stepLeadBlocks(step);
            const bodyBlocks = stepBodyBlocks(step);
            return (
              <article className="workbench-step" id={step.id} key={step.id}>
                <div className="workbench-step-top">
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <StepHelpActions guide={guide} helpContext={helpContext} step={step} stepNumber={index + 1} />
                </div>
                {leadBlocks.length > 0 && <MarkdownBlocks blocks={leadBlocks} promptContext={{ prompts: content.prompts, challengePrompt: content.challengePrompt }} />}
                {step.explainer && (
                  <p className="workbench-step-explainer">{step.explainer}</p>
                )}
                <h3>{step.title}</h3>
                {!step.explainer && step.summary && (
                  <p className="workbench-step-subtitle">{step.summary}</p>
                )}
                <MarkdownBlocks blocks={bodyBlocks} promptContext={{ prompts: content.prompts, challengePrompt: content.challengePrompt }} />
              </article>
            );
          })}
          {guide.closingSections.map((section) => (
            <article className="workbench-step workbench-close" id={section.id} key={section.title}>
              <div className="workbench-step-top">
                <span>{section.title.includes("Bonus") ? "Bonus" : "Finish"}</span>
              </div>
              <h3>{section.title}</h3>
              <MarkdownBlocks blocks={section.blocks} promptContext={{ prompts: content.prompts, challengePrompt: content.challengePrompt }} />
            </article>
          ))}
        </div>
      </div>
      </section>
      </div>
    </section>
  );
}

function GuideTableOfContents({ guide, config = {}, title = "Guide contents" }) {
  const navigation = useMemo(() => guideTocModel(guide, config, title), [guide, config, title]);
  const [activeId, setActiveId] = useState(navigation.groups[0]?.items[0]?.id || "");
  const desktopNavRef = useRef(null);

  useEffect(() => {
    const items = navigation.groups.flatMap((group) => group.items);
    if (!items.length) return undefined;
    const hashId = window.location.hash.replace("#", "");
    if (hashId && items.some((item) => item.id === hashId)) setActiveId(hashId);
    const sections = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveId(visible.target.id);
    }, { rootMargin: "-16% 0px -72% 0px", threshold: [0.01, 0.2, 0.45] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navigation]);

  useEffect(() => {
    const container = desktopNavRef.current;
    const activeLink = container?.querySelector(`a[href="#${activeId}"]`);
    if (!container || !activeLink) return;
    const linkTop = activeLink.offsetTop;
    const linkBottom = linkTop + activeLink.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (linkTop < viewTop || linkBottom > viewBottom) {
      container.scrollTo({
        top: Math.max(0, linkTop - (container.clientHeight / 2)),
        behavior: "smooth",
      });
    }
  }, [activeId]);

  if (!navigation.groups.length) return null;

  const contents = (
    <div className="guide-toc-inner">
      <div className="guide-toc-head">
        <span>{navigation.title}</span>
        <i aria-hidden="true" />
      </div>
      <div className="guide-toc-groups">
        {navigation.groups.map((group) => (
          <section className="guide-toc-group" key={group.key}>
            <h2>{group.title}</h2>
            <div className="guide-toc-items">
              {group.items.map((item) => (
                <a
                  className={activeId === item.id ? "active" : ""}
                  href={`#${item.id}`}
                  key={item.key}
                  onClick={() => setActiveId(item.id)}
                >
                  <span>{item.marker}</span>
                  <strong>{item.label}</strong>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="guide-toc" aria-label={navigation.title}>
      <div className="guide-toc-desktop" ref={desktopNavRef}>{contents}</div>
      <details className="guide-toc-mobile">
        <summary>{navigation.title}<span>View sections</span></summary>
        {contents}
      </details>
    </aside>
  );
}

function HoverTableOfContents({ title = "Contents", items = [] }) {
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return undefined;

    const hashId = window.location.hash.replace("#", "");
    if (hashId && items.some((item) => item.id === hashId)) {
      setActiveId(hashId);
    }

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0.01, 0.2, 0.45],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="hover-toc" aria-label={title}>
      <div className="hover-toc-tab" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hover-toc-panel">
        <div className="hover-toc-head">
          <span>{title}</span>
        </div>
        <div className="hover-toc-list">
          {items.map((item) => (
            <a
              className={`hover-toc-link hover-toc-link-${item.level || 1}${activeId === item.id ? " active" : ""}`}
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveId(item.id)}
            >
              <span>{item.marker}</span>
              <strong>{item.label}</strong>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function guideTocLabel(label) {
  return label;
}

function guideTocItems(guide) {
  return [
    ...guide.introSections.map((section, index) => ({
      key: `intro-${index}`,
      id: section.id,
      marker: index === 0 ? "Start" : "Prep",
      label: guideTocLabel(section.title),
      sourceLabel: section.title,
      groupKey: "start-here",
      groupTitle: "Start Here",
      level: 1,
    })),
    ...guide.steps.map((step) => ({
      key: `step-${step.stepNumber}`,
      id: step.id,
      marker: String(step.stepNumber).padStart(2, "0"),
      label: guideTocLabel(step.shortTitle),
      sourceLabel: step.shortTitle,
      groupKey: step.tocGroupKey,
      groupTitle: step.tocGroupTitle,
      level: 1,
    })),
    ...guide.closingSections.map((section, index) => ({
      key: `closing-${index}`,
      id: section.id,
      marker: "End",
      label: guideTocLabel(section.title),
      sourceLabel: section.title,
      groupKey: "finish",
      groupTitle: "Finish",
      level: 1,
    })),
  ];
}

function guideTocModel(guide, config = {}, title = "Guide contents") {
  const baseItems = guide.tocItems || [];
  const groupMap = new Map();
  const groupOrder = [];

  baseItems.forEach((item) => {
    const groupKey = item.groupKey || "guide";
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { key: groupKey, title: item.groupTitle || "Guide", items: [] });
      groupOrder.push(groupKey);
    }
    groupMap.get(groupKey).items.push(item);
  });

  return {
    title: config?.title || title,
    groups: groupOrder.map((key) => groupMap.get(key)).filter((group) => group.items.length),
  };
}

function markdownTocItems(content) {
  const blocks = buildMarkdownBlocks(content);
  const seen = new Map();

  return blocks
    .filter((block) => block.type === "h3" || block.type === "h4" || isChallengeStepHeading(block))
    .map((block, index) => {
      const baseId = sectionId(block.text);
      const nextCount = (seen.get(baseId) || 0) + 1;
      seen.set(baseId, nextCount);
      const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
      return {
        id,
        marker: String(index + 1).padStart(2, "0"),
        label: challengeTocLabel(block.text),
        level: 1,
      };
    });
}

function challengeTocLabel(label) {
  return label.replace(/^Step\s+\d+\s*[-:–]\s*/i, "").trim();
}

function isChallengeStepHeading(block) {
  return block.type === "h5" && /^Step\s+\d+\s*[-:–]/i.test(block.text);
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

function MarkdownHeading({ block }) {
  const Tag = block.type;

  return (
    <Tag id={block.id} className={isGuideCardLeadIn(block) ? "md-part-heading" : undefined}>
      {renderInlineMarkdown(block.text)}
    </Tag>
  );
}

function IntroSectionCard({ section, monthSlug = "june", navigate }) {
  const isBeforeStart = section.title === "Before You Start";
  const dynamicPrep = isBeforeStart ? prepChecklistFromBlocks(section.blocks) : { items: [], notes: [], experience: "" };
  const checklistItems = dynamicPrep.items;

  if (!isBeforeStart || !checklistItems.length) {
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
      <BeforeStartChecklist items={checklistItems} navigate={navigate} />
      {dynamicPrep.notes.map((note) => (
        <MarkdownNote text={`Note: ${note}`} key={note} />
      ))}
      {dynamicPrep.experience && (
        <PrepExperienceBox>{dynamicPrep.experience}</PrepExperienceBox>
      )}
    </article>
  );
}

function BeforeStartChecklist({ items = [], navigate }) {
  return (
    <div className="before-start-checklist">
      {items.map((item) => (
        <div className="before-start-item" key={item.label}>
          <span className="before-start-check" aria-hidden="true" />
          <div>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
            {item.internal && item.link ? (
              <button type="button" className="link-button" onClick={() => navigate(item.link)}>
                {item.linkLabel}
              </button>
            ) : item.link && (
              <LinkButton href={item.link}>{item.linkLabel}</LinkButton>
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

function StepHelpActions({ guide, helpContext, step, stepNumber }) {
  const [status, setStatus] = useState("");

  async function handleModHelp() {
    trackStepHelpClick("ask_mods_click", helpContext, step, stepNumber);
    await copyText(buildModHelpMessage(helpContext, step, stepNumber));
    setStatus("Mod message copied");
    window.setTimeout(() => setStatus(""), 1800);
  }

  async function handleAiHelp() {
    trackStepHelpClick("ask_ai_click", helpContext, step, stepNumber);
    await copyText(buildAiHelpMessage(guide, helpContext, step, stepNumber));
    setStatus("AI context copied");
    window.setTimeout(() => setStatus(""), 1800);
  }

  return (
    <div className="step-help-actions" aria-label={`Help actions for ${step.title}`}>
      <HelpActionWithTip tip="Copies a ready-made prompt to your clipboard. Paste it into any AI model to get help with this guide.">
        <button type="button" onClick={handleAiHelp}>Ask AI</button>
      </HelpActionWithTip>
      <HelpActionWithTip tip="Opens the Mastery community Q&A, where you can post a question and get an answer.">
        <a href={MOD_HELP_URL} target="_blank" rel="noreferrer" onClick={handleModHelp}>Ask Mods</a>
      </HelpActionWithTip>
      {status && <span className="step-help-status" role="status">{status}</span>}
    </div>
  );
}

function HelpActionWithTip({ children, tip }) {
  return (
    <span className="step-help-action">
      {children}
      <span className="step-help-tip" role="tooltip">{tip}</span>
    </span>
  );
}

function RedirectRoute({ to, navigate }) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return (
    <section className="section page-section">
      <p className="muted">Opening the current month...</p>
    </section>
  );
}

function ExternalRedirectRoute({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <section className="section page-section">
      <p className="muted">Opening Challenge Submissions...</p>
    </section>
  );
}

function JulyPrerequisitesPage({ navigate, isCurrentWorkshop = false }) {
  return (
    <section className="section page-section month-section" aria-labelledby="july-prerequisites-title">
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel: "July", monthSlug: "july", leafLabel: "Prerequisites" })}
        navigate={navigate}
      />
      <section className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">July guide prep</p>
            <h1 id="july-prerequisites-title" className="page-title">Before You Start</h1>
            <p>Complete these setup steps so you can jump straight into the July AI Hub workflow.</p>
          </div>
        </div>
        <div className="before-start-checklist">
          {JULY_PREREQUISITES.map((item, index) => (
            <div className="before-start-item" key={item.label}>
              <span className="before-start-check" aria-label={`Step ${index + 1}`} />
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
                {item.internal ? (
                  <button type="button" className="link-button" onClick={() => navigate(item.link)}>
                    {item.linkLabel}
                  </button>
                ) : (
                  <LinkButton href={item.link}>{item.linkLabel}</LinkButton>
                )}
              </div>
            </div>
          ))}
        </div>
        <article className="prerequisites-video resource-card">
          <div className="resource-card-top">
            <span>Walkthrough video</span>
            <small>July prep</small>
          </div>
          <h4>Watch the setup walkthrough</h4>
          <p>Use this video at the end if you want to follow the July setup visually before opening the guide.</p>
          <div className="video-embed" aria-label="July prerequisites walkthrough video">
            <iframe
              title="July prerequisites walkthrough"
              src={JULY_PREREQUISITES_VIDEO_EMBED_URL}
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </article>
      </section>
    </section>
  );
}

function SessionPromptsPage({
  navigate,
  content = MONTH6_CONTENT,
  monthLabel = "June",
  monthSlug = "june",
  pageTitle = "June Live Materials",
  lead = "Use these prompts while following the replay. Copy each prompt into Claude Cowork at the matching step.",
  breadcrumbLabel = "Live Materials",
  sectionLabel = "Prompts",
  showMaterials = true,
  isCurrentWorkshop = false,
}) {
  const prompts = content.prompts || [];
  const helpPrompt = prompts.find((prompt) => /^Prompt 5\b/.test(prompt.title || ""));
  const visiblePrompts = prompts.filter((prompt) => !/^Prompt 5\b/.test(prompt.title || ""));

  return (
    <section className="section page-section month-section" aria-labelledby="prompts-title">
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel, monthSlug, leafLabel: breadcrumbLabel })}
        navigate={navigate}
      />
      <section className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">{sectionLabel}</p>
            <h1 id="prompts-title" className="page-title">{pageTitle}</h1>
            <p>{lead}</p>
          </div>
          {showMaterials && content.materialsUrl && (
            <LinkButton href={content.materialsUrl}>Download Materials</LinkButton>
          )}
        </div>
        {content.video && (
          <article className="prompt-video-card resource-card">
            <div className="resource-card-top">
              <span>{content.video.eyebrow}</span>
              <small>{monthLabel}</small>
            </div>
            <h4>{content.video.title}</h4>
            <p>{content.video.intro}</p>
            <div className="video-embed" aria-label={content.video.ariaLabel}>
              <iframe
                title={content.video.title}
                src={content.video.src}
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </article>
        )}
        <div className="prompt-list">
          {visiblePrompts.length > 0 ? visiblePrompts.map((prompt) => (
            <PromptCard key={prompt.title} prompt={prompt} />
          )) : (
            <article className="resource-card">
              <div className="resource-card-top">
                <span>{sectionLabel}</span>
                <small>Empty</small>
              </div>
              <h4>No boxes published yet</h4>
              <p>This area is ready, but the admin team has not published any prompt boxes for it yet.</p>
            </article>
          )}
          {content.glossary && <GlossaryCard glossary={content.glossary} />}
          {content.skill && <HelpCard skill={content.skill} prompt={helpPrompt} />}
        </div>
      </section>
    </section>
  );
}

function UpcomingMonth({ month, navigate }) {
  return (
    <section className="section page-section month-section">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: month.label },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">{month.number}</p>
        <h1 className="page-title">{month.focus}</h1>
        <p className="muted">This month is not open yet. The replay, guide, and session prompts will appear here when it goes live.</p>
      </div>
    </section>
  );
}

function workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel, monthSlug, leafLabel }) {
  if (isCurrentWorkshop) {
    return [
      { label: "Current Workshop", path: CURRENT_WORKSHOP_PATH },
      { label: leafLabel },
    ];
  }

  return [
    { label: "Past Workshops", path: "/past-workshops" },
    { label: monthLabel, path: `/past-workshops/${monthSlug}` },
    { label: leafLabel },
  ];
}

function Breadcrumbs({ items, navigate }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <button type="button" onClick={() => navigate("/")}>Home</button>
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <span>/</span>
          {item.path ? (
            <button type="button" onClick={() => navigate(item.path)}>{item.label}</button>
          ) : (
            <strong>{item.label}</strong>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function MonthChoiceSections({
  activeId,
  basePath,
  navigate,
  cmsMonths = [],
  currentTitle = "Current and upcoming months",
  pastTitle = "Past months",
}) {
  const liveWorkshop = liveWorkshopFrom(cmsMonths);
  const liveStaticIndex = VISIBLE_MONTHS.findIndex((month) => month.label.toLowerCase() === liveWorkshop.slug);
  const fallbackCurrentIndex = CURRENT_MONTH_INDEX >= 0 ? CURRENT_MONTH_INDEX : 0;
  const currentIndex = liveStaticIndex >= 0 ? liveStaticIndex : fallbackCurrentIndex;
  const currentAndUpcomingMonths = [
    liveWorkshop.month,
    ...VISIBLE_MONTHS.filter((month, index) => index > currentIndex && month.label.toLowerCase() !== liveWorkshop.slug),
  ];
  const pastMonths = VISIBLE_MONTHS.filter((month, index) => (
    index < currentIndex && month.available && month.label.toLowerCase() !== liveWorkshop.slug
  ));

  return (
    <div className="month-choice-sections">
      <MonthChoiceGroup
        title={currentTitle}
        months={currentAndUpcomingMonths}
        activeId={liveWorkshop.slug || activeId}
        basePath={basePath}
        navigate={navigate}
        cmsMonths={cmsMonths}
      />
      {pastMonths.length > 0 && (
        <MonthChoiceGroup
          title={pastTitle}
          months={pastMonths}
          activeId={activeId}
          basePath={basePath}
          navigate={navigate}
          cmsMonths={cmsMonths}
        />
      )}
    </div>
  );
}

function MonthChoiceGroup({ title, months, activeId, basePath, navigate, cmsMonths = [] }) {
  return (
    <div className="month-choice-group">
      <h2 className="month-choice-group-title">{title}</h2>
      <MonthChoiceGrid months={months} activeId={activeId} basePath={basePath} navigate={navigate} cmsMonths={cmsMonths} />
    </div>
  );
}

function MonthChoiceGrid({ months = VISIBLE_MONTHS, activeId, basePath, navigate, cmsMonths = [] }) {
  return (
    <div className="month-choice-grid" aria-label="Mastery months">
      {months.map((month) => {
        const slug = monthSlug(month);
        const isActive = month.id === activeId || slug === activeId;
        const cmsMonth = cmsMonths.find((item) => item.slug === slug);
        const isOpen = isActive || month.available || Boolean(cmsMonth) || month.calendarUrl;
        const statusLabel = isActive ? "Current" : cmsMonth ? "Live" : month.available ? "Open" : "Calendar";
        function openMonth() {
          if (cmsMonth) {
            navigate(`${basePath}/${cmsMonth.slug}`);
            return;
          }
          if (month.calendarUrl && !month.available && !isActive) {
            window.location.assign(month.calendarUrl);
            return;
          }
          navigate(`${basePath}/${slug}`);
        }
        return (
          <button
            key={month.id}
            type="button"
            className={`month-choice ${month.image ? "has-image" : ""} ${isActive ? "active" : isOpen ? "" : "disabled"}`}
            disabled={!isOpen}
            onClick={openMonth}
          >
            {month.image && (
              <img className="month-choice-image" src={month.image.src} alt="" loading="lazy" />
            )}
            <span>{month.label}</span>
            <small>{month.topic || month.focus}</small>
            <strong>{statusLabel}</strong>
          </button>
        );
      })}
    </div>
  );
}

function LinkButton({ href, children }) {
  return (
    <a className="link-button" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false);
  const isDownload = Boolean(prompt.file);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt.text);
    trackEvent("copy_prompt_click", {
      metadata: {
        prompt_title: prompt.title || "Prompt card",
        source: "prompt_card",
      },
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (isDownload) {
    return (
      <article className="prompt-card prompt-download-card">
        <div className="prompt-download-head">
          <span>{prompt.title}</span>
          <small>{prompt.summaryLabel || "Download"}</small>
        </div>
        {prompt.description && <p>{prompt.description}</p>}
        <div className="prompt-actions">
          <a
            className="link-button"
            href={prompt.file}
            download={prompt.filename || true}
            onClick={() => trackEvent("download_skill_click", {
              metadata: {
                prompt_title: prompt.title || "Skill card",
                filename: prompt.filename || prompt.file,
                source: "prompt_card",
              },
            })}
          >
            {prompt.downloadLabel || "Download file"}
          </a>
        </div>
      </article>
    );
  }

  return (
    <details className="prompt-card">
      <summary>
        <span>{prompt.title}</span>
        <small>Open prompt</small>
      </summary>
      <div className="prompt-actions">
        <button type="button" onClick={copyPrompt}>{copied ? "Copied" : "Copy prompt"}</button>
      </div>
      <pre>{prompt.text}</pre>
    </details>
  );
}

function GlossaryCard({ glossary }) {
  if (!glossary) return null;
  const glossaryModel = parseGlossary(glossary);
  return (
    <details className="prompt-card glossary-card" id="glossary">
      <summary>
        <span>{glossaryModel.title}</span>
        <small>Open glossary</small>
      </summary>
      <div className="glossary-content">
        {glossaryModel.intro && <p className="glossary-intro">{renderInlineMarkdown(glossaryModel.intro)}</p>}
        <div className="glossary-section-grid">
          {glossaryModel.sections.map((section) => (
            <section className="glossary-section" key={section.title}>
              <h3>{section.title}</h3>
              <div className="glossary-terms">
                {section.terms.map((term) => (
                  <article className="glossary-term" key={`${section.title}-${term.name}`}>
                    <h4>{renderInlineMarkdown(term.name)}</h4>
                    <p>{renderInlineMarkdown(term.description)}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}

function HelpCard({ skill, prompt }) {
  const [copied, setCopied] = useState(false);

  async function copyHelpPrompt() {
    if (!prompt?.text) return;
    await copyText(prompt.text);
    trackEvent("copy_prompt_click", {
      metadata: {
        prompt_title: prompt.title || "Help prompt",
        source: "help_card",
      },
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="get-help-card">
      <div className="resource-card-top">
        <span>Bonus</span>
        <small>Choose your path</small>
      </div>
      <h3>{skill.title}</h3>
      <p>{skill.description}</p>
      <div className="get-help-options" aria-label="Get help options">
        {prompt?.text && (
          <button type="button" onClick={copyHelpPrompt}>
            <span>Copy help prompt</span>
            <small>{copied ? "Copied" : "Paste into Cowork when something breaks"}</small>
          </button>
        )}
        <a href={skill.file} download={skill.filename}>
          <span>Download Hub Doctor skill</span>
          <small>Install once, run from Claude's skill menu</small>
        </a>
      </div>
    </article>
  );
}

function parseGlossary(glossary) {
  const lines = glossary.split("\n").map((line) => line.trim()).filter(Boolean);
  const titleLine = lines.find((line) => line.startsWith("# ")) || "# Glossary";
  const introLine = lines.find((line) => line.startsWith("*") && line.endsWith("*")) || "";
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      currentSection = {
        title: line.replace(/^##\s+/, ""),
        terms: [],
      };
      sections.push(currentSection);
      return;
    }

    const termMatch = line.match(/^-\s+\*\*(.+?)\*\*:\s+(.+)$/);
    if (termMatch && currentSection) {
      currentSection.terms.push({
        name: termMatch[1],
        description: termMatch[2],
      });
    }
  });

  return {
    title: titleLine.replace(/^#\s+/, "").replace(/^📖\s*/, ""),
    intro: introLine.replace(/^\*/, "").replace(/\*$/, ""),
    sections: sections.filter((section) => section.terms.length),
  };
}

function CopyPromptButton({ promptNumber, promptContext = {} }) {
  const [copied, setCopied] = useState(false);
  const prompt = resolvePromptControl({ type: "copy-prompt", prompt: promptNumber }, promptContext);
  if (!prompt) return null;
  async function onCopy() {
    await copyText(prompt.text);
    trackEvent("copy_prompt_click", {
      metadata: {
        prompt_title: prompt.title || `Prompt ${promptNumber}`,
        prompt_number: promptNumber,
        source: "guide_copy_button",
      },
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="guide-copy-prompt"
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        margin: "4px 0 16px", padding: "11px 18px", border: "none",
        borderRadius: "10px", background: copied ? "#1f7a4d" : "#1d1d1f",
        color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer",
        transition: "background .15s",
      }}
    >
      {copied ? "✓ Copied to clipboard" : `📋 Copy ${prompt.title}`}
    </button>
  );
}

function ChallengePromptButton({ promptContext = {} }) {
  const [copied, setCopied] = useState(false);
  const prompt = resolvePromptControl({ type: "copy-challenge-prompt" }, promptContext);
  if (!prompt) return null;
  const text = prompt.text;

  async function onCopy() {
    await copyText(text);
    trackEvent("copy_prompt_click", {
      metadata: {
        prompt_title: "Challenge prompt",
        source: "challenge_prompt_button",
      },
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="guide-copy-prompt"
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        margin: "4px 0 16px", padding: "11px 18px", border: "none",
        borderRadius: "10px", background: copied ? "#1f7a4d" : "#1d1d1f",
        color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer",
        transition: "background .15s",
      }}
    >
      {copied ? "✓ Copied to clipboard" : "📋 Copy challenge prompt"}
    </button>
  );
}

function GuideImageGallery({ images = [] }) {
  if (!images.length) return null;

  return (
    <div className="guide-image-gallery" aria-label="Guide screenshots">
      {images.map((image) => (
        <figure key={image.src}>
          <img src={image.src} alt={image.alt} loading="lazy" />
          <figcaption>{image.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function MarkdownBlocks({ blocks, promptContext = {} }) {
  return (
    <div className="markdown-document markdown-document-embedded">
      {blocks.map((block, index) => (
        <MarkdownBlockErrorBoundary block={block} key={`${index}-${block.type}-${block.text?.slice(0, 12) || block.src?.slice(0, 12) || ""}`}>
          <MarkdownBlock block={block} promptContext={promptContext} />
        </MarkdownBlockErrorBoundary>
      ))}
    </div>
  );
}

function MarkdownDocument({ content }) {
  const blocks = useMemo(() => blocksWithHeadingIds(content), [content]);

  return (
    <div className="markdown-document">
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
        <div className="md-image-fallback" role="alert">
          <strong>Preview unavailable</strong>
          <span>{block.type === "image" ? "This screenshot could not be rendered." : "This Markdown line could not be rendered."}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

function MarkdownSectionCards({ content }) {
  const sections = useMemo(() => groupedMarkdownSections(content), [content]);

  return (
    <div className="workbench-layout challenge-workbench-layout">
      <div className="workbench-stack">
        {sections.map((section, index) => (
          <article className="workbench-step challenge-guide-card" key={`${section.title}-${index}`}>
            <div className="workbench-step-top">
              <small>{String(index + 1).padStart(2, "0")}</small>
            </div>
            <MarkdownBlocks blocks={section.blocks} />
          </article>
        ))}
      </div>
    </div>
  );
}

function GenericGuideCards({ content }) {
  const sections = useMemo(() => groupedMarkdownSections(content), [content]);
  return (
    <>
      {sections.map((section, index) => (
        <article className="workbench-step" id={section.blocks[0]?.id || sectionId(section.title)} key={`${section.title}-${index}`}>
          <div className="workbench-step-top">
            <small>{String(index + 1).padStart(2, "0")}</small>
          </div>
          <MarkdownBlocks blocks={section.blocks} />
        </article>
      ))}
    </>
  );
}

function deriveStepSummary(section = {}) {
  const firstUsefulBlock = (section.blocks || []).find((block) => {
    if (!block?.text) return false;
    return ["paragraph", "quote", "bullet", "check"].includes(block.type);
  });

  const text = blocksToPlainText(firstUsefulBlock ? [firstUsefulBlock] : section.blocks || [])
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+/, "")
    .trim();

  if (!text) return `Complete ${section.title.replace(/^Step\s+\d+:\s*/, "")}.`;
  return text.length > 210 ? `${text.slice(0, 207).trim()}...` : text;
}

function getChallengeGuideModel(content, explainers = {}) {
  const sections = groupedMarkdownSections(content);
  const steps = sections.map((section, index) => {
    const heading = section.blocks[0];
    const title = section.title;
    return {
      id: heading?.id || sectionId(title),
      title,
      shortTitle: challengeTocLabel(title),
      stepNumber: index + 1,
      summary: explainers[title] || deriveStepSummary({ title, blocks: section.blocks.slice(1) }),
      explainer: explainers[title] || "",
      blocks: section.blocks.slice(1),
    };
  });

  return {
    steps,
    tocItems: steps.map((step) => ({
      key: `challenge-${step.stepNumber}`,
      id: step.id,
      marker: String(step.stepNumber).padStart(2, "0"),
      label: challengeTocLabel(step.shortTitle),
      sourceLabel: step.title,
      groupKey: "challenge",
      groupTitle: "Challenge",
      level: 1,
    })),
    fullContext: content,
  };
}

function ChallengeWorkbench({
  content,
  helpContext,
  explainers = {},
  guide,
}) {
  const challengeMarkdown = content?.challenge || "";
  const promptContext = normalizePromptContext(content);
  const fallbackGuide = useMemo(() => getChallengeGuideModel(challengeMarkdown, explainers), [challengeMarkdown, explainers]);
  const challengeGuide = guide || fallbackGuide;

  return (
    <div className="workbench-layout challenge-workbench-layout">
      <div className="workbench-stack">
        {challengeGuide.steps.map((step, index) => (
          <article className="workbench-step challenge-guide-card" id={step.id} key={step.id}>
            <div className="workbench-step-top">
              <small>{String(index + 1).padStart(2, "0")}</small>
              <StepHelpActions guide={challengeGuide} helpContext={helpContext} step={step} stepNumber={index + 1} />
            </div>
            {step.explainer && (
              <p className="workbench-step-explainer">{step.explainer}</p>
            )}
            <h3>{renderInlineMarkdown(step.title)}</h3>
            <MarkdownBlocks blocks={step.blocks} promptContext={promptContext} />
          </article>
        ))}
      </div>
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
      const summary = deriveStepSummary({ ...section, blocks: stepBodyBlocks(section) });
      steps.push({
        ...section,
        tocGroupKey,
        tocGroupTitle,
        stepNumber: steps.length + 1,
        shortTitle: section.title.replace(/^Step \d+:\s*/, ""),
        summary,
        explainer: "",
      });
    }
  });

  return {
    introSections,
    steps,
    closingSections,
    tocItems: guideTocItems({
      introSections,
      steps,
      closingSections,
    }),
    fullContext: content,
  };
}

function toTitleCase(value = "") {
  const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "the", "to", "with"]);
  return value.trim().toLowerCase().split(/\s+/).map((word, index) => (
    index > 0 && smallWords.has(word) ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
  )).join(" ");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function buildModHelpMessage(helpContext, step, stepNumber) {
  const stepPurpose = step.summary || deriveStepSummary(step);
  return [
    `Hi mods, I need help with the ${helpContext.guideName}.`,
    "",
    `Guide link: ${helpContext.guideLink}`,
    `Current location: Step ${stepNumber}: ${step.shortTitle}`,
    `What this step is for: ${stepPurpose}`,
    "",
    "Step instructions I am following:",
    blocksToPlainText(step.blocks).slice(0, 1400),
    "",
    "What I need help with:",
    "[Write what happened, what you tried, and any extra context here. Add a screenshot if useful.]",
  ].join("\n");
}

function buildAiHelpMessage(guide, helpContext, step, stepNumber) {
  const stepList = guide.steps
    .map((item, index) => `${index + 1}. ${item.shortTitle}: ${item.summary || deriveStepSummary(item)}`)
    .join("\n");
  const previousStep = guide.steps[stepNumber - 2];
  const nextStep = guide.steps[stepNumber];
  const stepPurpose = step.summary || deriveStepSummary(step);

  return [
    `You are helping me complete the ${helpContext.guideName}.`,
    `Guide link: ${helpContext.guideLink}`,
    "",
    "Overall guide goal:",
    helpContext.overallGoal,
    helpContext.monthFocus ? `Month focus: ${helpContext.monthFocus}` : "",
    "",
    "All guide steps:",
    stepList,
    "",
    `My current location: Step ${stepNumber}: ${step.title}`,
    previousStep ? `Previous step: Step ${stepNumber - 1}: ${previousStep.shortTitle}` : "",
    nextStep ? `Next step: Step ${stepNumber + 1}: ${nextStep.shortTitle}` : "",
    `What this step is for: ${stepPurpose}`,
    "",
    "Current step instructions:",
    blocksToPlainText(step.blocks),
    "",
    "What I need from you:",
    helpContext.aiInstruction,
    "",
    "My extra context:",
    "[Paste what happened, any error message, or a screenshot description here.]",
    "",
    "Full guide context:",
    guide.fullContext,
  ].filter((line) => line !== "").join("\n");
}

function blocksToPlainText(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === "image") return `[Image: ${block.alt}]`;
      if (block.type === "code") return `\n${block.text}\n`;
      return block.text || "";
    })
    .filter(Boolean)
    .join("\n");
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

function sectionId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildMarkdownBlocks(content) {
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

    const promptControl = parsePromptControlMarker(trimmed);
    if (promptControl) {
      blocks.push(promptControl);
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

function MarkdownBlock({ block, promptContext = {} }) {
  if (block.type === "space") return <div className="md-space" />;
  if (block.type === "rule") return <hr className="md-rule" />;
  if (block.type === "code") return <CopyableCodeBlock text={block.text} />;
  if (block.type === "image") {
    return <MarkdownImageFigure block={block} />;
  }
  if (block.type === "copy-prompt") return <CopyPromptButton promptNumber={block.prompt} promptContext={promptContext} />;
  if (block.type === "copy-challenge-prompt") return <ChallengePromptButton promptContext={promptContext} />;
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

function CopyableCodeBlock({ text }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await copyText(text);
    trackEvent("copy_prompt_click", {
      metadata: {
        prompt_title: "Code block",
        source: "code_block",
      },
    });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="md-code-wrap">
      <div className="md-code-actions">
        <span>Prompt</span>
        <button type="button" onClick={onCopy}>
          {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre className="md-code">{text}</pre>
    </div>
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

function monthSlugFromLabel(label = "") {
  return label.toLowerCase();
}

function pastSystemToMonthCard(item) {
  return {
    id: item.id,
    label: item.month,
    number: item.month,
    focus: item.system,
    outcome: item.summary,
    tools: item.tools,
    difficulty: item.difficulty,
    image: item.month === "June"
      ? MONTHS.find((month) => month.id === "jun")?.image
      : {
          src: "/july/july-ai-hub-card-relatable-3.png",
          alt: `${item.month} Mastery workshop`,
          kicker: "Past workshop",
          title: `${item.month}: ${item.system}`,
          caption: item.summary,
        },
  };
}

function PastWorkshopsPage({ path, navigate, cmsMonths = [] }) {
  const selectedSlug = path.split("/")[2] || "";
  const liveSlug = liveWorkshopFrom(cmsMonths).slug;
  const selectedCmsMonth = selectedSlug && selectedSlug !== liveSlug
    ? cmsMonths.find((month) => month.slug === selectedSlug)
    : null;
  const selectedSystem = selectedSlug
    ? PAST_SYSTEMS.find((item) => monthSlugFromLabel(item.month) === selectedSlug)
    : null;
  const cmsPastMonths = cmsMonths.filter((month) => month.slug && month.slug !== liveSlug);
  const fallbackSystems = PAST_SYSTEMS.filter((item) => {
    const slug = monthSlugFromLabel(item.month);
    return slug !== liveSlug && !cmsPastMonths.some((month) => month.slug === slug);
  });

  if (selectedCmsMonth) {
    return <CmsResourcesMenu month={selectedCmsMonth} navigate={navigate} isPast />;
  }

  if (selectedSlug && !selectedSystem) {
    return <RedirectRoute to="/past-workshops" navigate={navigate} />;
  }

  if (selectedSystem) {
    return <PastWorkshopDetailPage item={selectedSystem} navigate={navigate} />;
  }

  return (
    <section className="section page-section month-section" aria-label="Past Workshops">
      <Breadcrumbs items={[{ label: "Past Workshops" }]} navigate={navigate} />

      <div className="resource-category-stack">
        <div className="month-choice-grid past-month-card-grid" aria-label="Previous months">
          {cmsPastMonths.map((month) => {
            const displayMonth = cmsMonthToMonth(month);
            return (
              <button
                className={`month-choice ${displayMonth.image ? "has-image" : ""} past-month-card past-month-card-complete`}
                type="button"
                key={month.slug}
                onClick={() => navigate(`/past-workshops/${month.slug}`)}
              >
                {displayMonth.image && <img className="month-choice-image" src={displayMonth.image.src} alt="" loading="lazy" />}
                <span>{displayMonth.label}</span>
                <small>{displayMonth.focus}</small>
                <strong>Open</strong>
              </button>
            );
          })}
          {fallbackSystems
            .slice()
            .reverse()
            .map((item, index) => {
              const slug = monthSlugFromLabel(item.month);
              const image = slug === "july"
                ? "/july/july-ai-hub-card-relatable-3.png"
                : index % 3 === 0
                  ? "/month6/alternates/month6-paperwork-alt-1.png"
                  : index % 3 === 1
                    ? "/month6/alternates/month6-paperwork-alt-2.png"
                    : "/month6/alternates/month6-paperwork-alt-3.png";
              return (
                <button
                  className="month-choice has-image past-month-card past-month-card-complete"
                  type="button"
                  key={item.id}
                  onClick={() => navigate(`/past-workshops/${slug}`)}
                >
                  <img
                    className="month-choice-image"
                    src={image}
                    alt=""
                    loading="lazy"
                  />
                  <span>{item.month}</span>
                  <small>{item.system}</small>
                  <strong>Open</strong>
                </button>
              );
            })}
        </div>

        <PastSystemsSection />
      </div>
    </section>
  );
}

function PastWorkshopDetailPage({ item, navigate }) {
  const slug = monthSlugFromLabel(item.month);
  const isJune = slug === "june";
  const resourceIsInternal = item.resourceUrl?.startsWith("/");
  const cardMonth = isJune
    ? MONTHS.find((month) => month.id === "jun") || pastSystemToMonthCard(item)
    : pastSystemToMonthCard(item);
  const titleId = `past-workshop-${slug}-title`;

  return (
    <section className="section page-section month-section" aria-labelledby={titleId}>
      <Breadcrumbs
        items={[
          { label: "Past Workshops", path: "/past-workshops" },
          { label: item.month },
        ]}
        navigate={navigate}
      />
      <div className="section-heading section-heading-compact">
        <p className="section-kicker">{item.month}</p>
        <h1 id={titleId} className="page-title">{item.system}</h1>
      </div>

      {isJune ? (
        <MonthVisualCard
          month={cardMonth}
          actionLinks={[
            { label: "Replay", href: MONTH6_CONTENT.replayUrl },
            { label: "Guide", onClick: () => navigate("/monthly-resources/june/guide") },
            { label: "Prompts", onClick: () => navigate("/monthly-resources/june/prompts") },
            { label: "Challenge", onClick: () => navigate("/challenges/june/guide") },
            { label: "Submissions", href: CHALLENGE_SUBMISSIONS_URL },
          ]}
          variant="banner"
        />
      ) : (
        <div className="past-workshop-detail-card">
          <p>{item.summary}</p>
          <div>
            <span>Note from Igor</span>
            <strong>{item.igorComment}</strong>
          </div>
        </div>
      )}

      <div className={isJune ? "resource-category" : undefined}>
        {isJune && (
          <div className="resource-category-head">
            <h3>Workshop</h3>
          </div>
        )}
        <div className="resource-grid resource-grid-three">
          <a className="resource-card resource-card-link" href={item.replayUrl} target="_blank" rel="noreferrer">
            <div className="resource-card-top">
              <span>Replay</span>
              <small>Club</small>
            </div>
            <h4>{item.month} Replay</h4>
            <p>Watch the workshop recording in the AI Advantage Club.</p>
          </a>
          {resourceIsInternal ? (
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate(isJune ? "/monthly-resources/june/guide" : item.resourceUrl)}>
              <div className="resource-card-top">
                <span>Resources</span>
                <small>Hub</small>
              </div>
              <h4>{item.month} Resources</h4>
              <p>Open the Hub materials for this month.</p>
            </button>
          ) : (
            <a className="resource-card resource-card-link" href={item.resourceUrl} target="_blank" rel="noreferrer">
              <div className="resource-card-top">
                <span>Resources</span>
                <small>Guide</small>
              </div>
              <h4>{item.month} Resources</h4>
              <p>Open the original resources for this month.</p>
            </a>
          )}
        </div>
      </div>

      {isJune && (
        <section className="resource-category" id="challenge-archive" aria-labelledby="june-challenge-archive-title">
          <div className="resource-category-head">
            <h3 id="june-challenge-archive-title">Challenge</h3>
          </div>
          <div className="resource-grid resource-grid-two">
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/june/guide")}>
              <div className="resource-card-top">
                <span>Challenge</span>
                <small>Archived guide</small>
              </div>
              <h4>Build a Self-Improving Skill</h4>
              <p>Read the full mission, workflow, deliverables, working prompt, and submission requirements.</p>
            </button>
            <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
              <div className="resource-card-top">
                <span>Submissions</span>
                <small>Community archive</small>
              </div>
              <h4>June Challenge Submissions</h4>
              <p>Browse the member projects submitted for the Self-Improving Skill challenge.</p>
            </a>
          </div>
        </section>
      )}
    </section>
  );
}

function PastSystemsSection() {
  return (
    <div className="past-systems-section" id="past-systems" aria-labelledby="past-systems-section-title">
      <div className="section-heading compact">
        <p className="section-kicker">Past systems</p>
        <h2 id="past-systems-section-title">Which old recordings should you watch?</h2>
        <p className="muted">Quick answer: all of this is optional. You do not need to finish every replay or go in order. Pick the month that matches your current comfort level.</p>
      </div>
      <PastSystemsTable />
    </div>
  );
}

function PastSystemsTable() {
  return (
    <div className="systems-table" role="table" aria-label="Past Mastery systems table">
        <div className="systems-row systems-head" role="row">
          <span role="columnheader">Month</span>
          <span role="columnheader">System</span>
          <span role="columnheader">Summary</span>
          <span role="columnheader">Note from Igor</span>
          <span role="columnheader">Links</span>
        </div>
        {PAST_SYSTEMS.slice().reverse().map((item) => (
          <PastSystemRow item={item} key={item.id} />
        ))}
      </div>
  );
}

function PastSystemRow({ item }) {
  const resourceIsInternal = item.resourceUrl?.startsWith("/");

  return (
    <article className={`systems-row system-difficulty-${item.difficulty.toLowerCase()}`} role="row">
      <div className="systems-month" role="cell">
        <strong>{item.month}</strong>
      </div>
      <div className="systems-system" role="cell">
        <strong>{item.system}</strong>
        <span>{item.tools}</span>
      </div>
      <div className="systems-summary" role="cell">
        <p>{item.summary}</p>
        <span className={`system-difficulty-pill system-difficulty-pill-${item.difficulty.toLowerCase()}`}>
          {item.difficulty}
        </span>
      </div>
      <div className="systems-comment" role="cell">
        <p>{item.igorComment}</p>
      </div>
      <div className="systems-links" role="cell">
        <a href={item.replayUrl} target="_blank" rel="noreferrer">Replay</a>
        {resourceIsInternal ? (
          <a href={item.resourceUrl}>Resources</a>
        ) : (
          <a href={item.resourceUrl} target="_blank" rel="noreferrer">Resources</a>
        )}
      </div>
    </article>
  );
}

function ChallengesPage({ handleSubmit, path, navigate, submissionStatus, submissions, cmsMonths = [] }) {
  const segment = path.split("/")[2] || "";
  const child = path.split("/")[3] || "";
  const cmsMonth = cmsMonths.find((month) => month.slug === segment);
  const liveSlug = liveWorkshopFrom(cmsMonths).slug;
  const isCurrentWorkshop = segment === liveSlug;

  if (path === "/challenges") {
    return <RedirectRoute to={currentWorkshopUrl(cmsMonths)} navigate={navigate} />;
  }

  if (segment === "july" && child === "submissions") {
    return <RedirectRoute to="/monthly-resources/july/challenge-submissions" navigate={navigate} />;
  }

  if (cmsMonth) {
    if (!cmsHasContent(cmsMonth, "challenge")) {
      return (
        <MonthUnavailable
          basePath="/challenges"
          label={segment}
          navigate={navigate}
          title="This challenge is not live yet."
          message="The month is open, but the challenge has not been published inside the month."
        />
      );
    }
    if (child === "guide") return <CmsChallengeGuidePage month={cmsMonth} navigate={navigate} isCurrentWorkshop={isCurrentWorkshop} />;
    if (child === "submit" || child === "submissions") return <ExternalRedirectRoute to={CHALLENGE_SUBMISSIONS_URL} />;
    return <RedirectRoute to={`/challenges/${cmsMonth.slug}/guide`} navigate={navigate} />;
  }

  if (segment === "june") {
    if (child === "guide") return <ChallengeGuidePage navigate={navigate} />;
    if (child === "submit" || child === "submissions") return <ExternalRedirectRoute to={CHALLENGE_SUBMISSIONS_URL} />;
    return <RedirectRoute to="/past-workshops" navigate={navigate} />;
  }

  if (segment !== "july") {
    const month = MONTHS.find((item) => item.label.toLowerCase() === segment && !item.hidden);
    if (!month) {
      return (
        <MonthUnavailable
          basePath="/challenges"
          label={segment}
          navigate={navigate}
          title="This challenge is not live yet."
          message="Choose a current or published challenge month."
        />
      );
    }

    return (
      <section className="section page-section challenge-section">
        <Breadcrumbs
          items={[
            { label: "Challenges", path: "/challenges" },
            { label: month.label },
          ]}
          navigate={navigate}
        />
        <div className="section-heading">
          <p className="section-kicker">{month.number}</p>
          <h1 className="page-title">{month.focus}</h1>
          <p className="muted">This challenge is not open yet. The guide, submission page, and submissions will appear here when the month goes live.</p>
        </div>
      </section>
    );
  }

  if (child === "guide") return <JulyChallengeGuidePage navigate={navigate} />;
  if (child === "submit") return <ExternalRedirectRoute to={CHALLENGE_SUBMISSIONS_URL} />;
  if (child === "submissions") return <RedirectRoute to="/monthly-resources/july/challenge-submissions" navigate={navigate} />;
  return <RedirectRoute to="/monthly-resources/july" navigate={navigate} />;
}

function CmsChallengeLanding({ month, navigate, isCurrentWorkshop = false }) {
  const displayMonth = cmsMonthToMonth({
    ...month,
    hero: {
      ...(month.hero || {}),
      kicker: "Published challenge",
      title: `${month.label} Challenge`,
    },
  });

  return (
    <section className="section page-section challenge-section" aria-labelledby={`${month.slug}-challenge-title`}>
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel: month.label, monthSlug: month.slug, leafLabel: "Challenge" })}
        navigate={navigate}
      />
      <div className="section-heading section-heading-compact">
        <h1 id={`${month.slug}-challenge-title`} className="page-title">{month.label} Challenge</h1>
      </div>
      <MonthVisualCard
        month={displayMonth}
        actionLabel="Open Challenge"
        onAction={() => navigate(`/challenges/${month.slug}/guide`)}
      />
      <div className="resource-grid resource-grid-two">
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate(`/challenges/${month.slug}/guide`)}>
          <div className="resource-card-top">
            <span>Challenge</span>
            <small>Guide</small>
          </div>
          <h4>Challenge Guide</h4>
          <p>Read the mission, steps, deliverables, and working prompt for this month.</p>
        </button>
        <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Submit</span>
            <small>Community</small>
          </div>
          <h4>Submit in Circle</h4>
          <p>Share your work in the Challenge Submissions space when you are ready.</p>
        </a>
      </div>
    </section>
  );
}

function CmsChallengeGuidePage({ month, navigate, isCurrentWorkshop = false }) {
  const challenge = month.challenge_markdown || "";
  const challengeGuide = useMemo(() => getChallengeGuideModel(challenge), [challenge]);
  const challengeStatus = useMemo(() => challengeStatusFromMarkdown(challenge), [challenge]);

  return (
    <section className="section page-section month-section guide-page-section" aria-labelledby={`${month.slug}-challenge-guide-title`}>
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel: month.label, monthSlug: month.slug, leafLabel: "Challenge" })}
        navigate={navigate}
      />
      <div className="guide-page-layout">
      <GuideTableOfContents guide={challengeGuide} title="Challenge contents" />
      <div className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id={`${month.slug}-challenge-guide-title`} className="page-title">{month.label} Challenge</h1>
            <ChallengeStatusStrip {...challengeStatus} />
            <p>{month.outcome || "Use this page to complete the monthly challenge and submit your work."}</p>
          </div>
        </div>
        <ChallengeWorkbench
          content={cmsMonthToContent(month)}
          helpContext={cmsGuideHelpContext(month, "challenge")}
          guide={challengeGuide}
        />
      </div>
      </div>
    </section>
  );
}

function CurrentChallengeComingSoon({ month, navigate }) {
  return (
    <section className="section page-section challenge-section" aria-labelledby="july-challenge-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "July" },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">{month.number}</p>
        <h1 id="july-challenge-title" className="page-title">July challenge coming soon.</h1>
        <p className="muted">The July challenge will unlock after the guide is published. For now, start with the July guide prerequisites.</p>
      </div>
      <div className="hero-actions">
        <button type="button" onClick={() => navigate("/monthly-resources/july/guide")}>Open July Prerequisites</button>
      </div>
    </section>
  );
}

function JulyChallengeLanding({ navigate }) {
  return (
    <section className="section page-section challenge-section" aria-labelledby="july-challenge-title">
      <Breadcrumbs items={[{ label: "Challenges", path: "/challenges" }, { label: "July" }]} navigate={navigate} />
      <div className="section-heading section-heading-compact">
        <h1 id="july-challenge-title" className="page-title">Paint your AI Hub</h1>
      </div>
      <MonthVisualCard
        month={JULY_CHALLENGE_CARD}
        actionLabel="Open Challenge"
        onAction={() => navigate("/challenges/july/guide")}
      />
      <div className="resource-grid resource-grid-three">
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/july/guide")}>
          <div className="resource-card-top">
            <span>Challenge</span>
          </div>
          <h4>July Challenge</h4>
          <p>Read the full mission, rules, deliverables, deadline, and the Design Director prompt.</p>
        </button>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/challenge-submissions")}>
          <div className="resource-card-top">
            <span>Submissions</span>
            <small>Registry</small>
          </div>
          <h4>Challenge Submission Registry</h4>
          <p>Browse the July challenge submissions with summaries, visual previews, and filters.</p>
        </button>
      </div>
    </section>
  );
}

function JuneChallengeLanding({ month, navigate }) {
  return (
    <section className="section page-section challenge-section" aria-labelledby="june-challenge-title">
      <Breadcrumbs items={[{ label: "Challenges", path: "/challenges" }, { label: "June" }]} navigate={navigate} />
      <div className="section-heading section-heading-compact">
        <h1 id="june-challenge-title" className="page-title">Build a Self-Improving Skill</h1>
      </div>
      <MonthVisualCard
        month={month}
        actionLinks={[
          { label: "Open Challenge", onClick: () => navigate("/challenges/june/guide") },
          { label: "View Submissions", href: CHALLENGE_SUBMISSIONS_URL },
        ]}
      />
      <div className="resource-grid">
        <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Submissions</span>
            <small>Community</small>
          </div>
          <h4>June Challenge Submissions</h4>
          <p>Browse the member posts from the Self-Improving Skill challenge in the AI Advantage Community.</p>
        </a>
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/june/guide")}>
          <div className="resource-card-top">
            <span>Challenge</span>
          </div>
          <h4>June Challenge</h4>
          <p>Read the full mission, rules, deliverables, deadline, and self-improving Skill workflow.</p>
        </button>
      </div>
    </section>
  );
}

function ChallengeSubmissionRegistryPage({ archive, navigate, isCurrentWorkshop = false }) {
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState("All");
  const [visualFilter, setVisualFilter] = useState("all");
  const eligibleSubmissions = archive.submissions.filter((submission) => submission.status !== "team-example");
  const filteredSubmissions = eligibleSubmissions.filter((submission) => {
    const haystack = [
      submission.title,
      submission.author,
      submission.summary,
      submission.excerpt,
      ...(submission.sourceTags || []),
      ...(submission.interests || []),
    ].join(" ").toLowerCase();
    const matchesQuery = !query.trim() || query.toLowerCase().split(/\s+/).every((term) => haystack.includes(term));
    const matchesInterest = interest === "All" || submission.interests?.includes(interest);
    const matchesVisual = visualFilter === "all"
      || (visualFilter === "with-images" && submission.displayImages?.length)
      || (visualFilter === "hub-links" && submission.hubLinks?.length);
    return matchesQuery && matchesInterest && matchesVisual;
  });

  return (
    <section className="section page-section challenge-registry-page" aria-labelledby="challenge-registry-title">
      <Breadcrumbs
        items={workshopBreadcrumbItems({ isCurrentWorkshop, monthLabel: "July", monthSlug: "july", leafLabel: "Challenge submissions" })}
        navigate={navigate}
      />
      <div className="challenge-registry-hero">
        <div>
          <p className="section-kicker">July challenge</p>
          <h1 id="challenge-registry-title" className="page-title">{archive.title}</h1>
          <p className="muted">{archive.description}</p>
        </div>
        <a className="registry-source-button" href={archive.sourceUrl} target="_blank" rel="noreferrer">Open Circle space</a>
      </div>

      <div className="challenge-registry-controls">
        <label>
          Search submissions
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, member, summary, style..." />
        </label>
        <label>
          Visual filter
          <select value={visualFilter} onChange={(event) => setVisualFilter(event.target.value)}>
            <option value="all">All submissions</option>
            <option value="with-images">With screenshots</option>
            <option value="hub-links">With hub links</option>
          </select>
        </label>
      </div>

      <div className="challenge-registry-chips" aria-label="Submission category filters">
        {archive.interestCategories.map((category) => (
          <button
            type="button"
            className={interest === category ? "active" : ""}
            onClick={() => setInterest(category)}
            key={category}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="challenge-submission-registry-grid" aria-live="polite">
        {filteredSubmissions.map((submission) => (
          <ChallengeSubmissionRegistryCard submission={submission} key={submission.id} />
        ))}
      </div>

      {!filteredSubmissions.length && (
        <div className="challenge-registry-empty">
          <h2>No submissions match this filter.</h2>
          <p>Try a broader search or choose All.</p>
        </div>
      )}
    </section>
  );
}

function ChallengeSubmissionRegistryCard({ submission }) {
  const preview = submission.displayImages?.[0];
  return (
    <article className="challenge-submission-card">
      {preview ? (
        <img className="challenge-submission-image" src={preview.src} alt={preview.alt} loading="lazy" />
      ) : (
        <div className="challenge-submission-image challenge-submission-placeholder">
          <span>No preview image</span>
        </div>
      )}
      <div className="challenge-submission-body">
        <h2>{submission.title}</h2>
        <p className="challenge-submission-author">{submission.author}</p>
        <p>{submission.summary}</p>
        <div className="challenge-submission-tags">
          {(submission.sourceTags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="challenge-submission-actions">
          <a href={submission.url} target="_blank" rel="noreferrer">Open post</a>
          {submission.hubLinks?.[0] && <a href={submission.hubLinks[0]} target="_blank" rel="noreferrer">Open hub</a>}
        </div>
      </div>
    </article>
  );
}

function JulyChallengeGuidePage({ navigate }) {
  const challengeGuide = useMemo(() => getChallengeGuideModel(JULY_CONTENT.challenge), []);
  return (
    <section className="section page-section month-section guide-page-section" aria-labelledby="challenge-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "July", path: "/challenges/july" },
          { label: "Challenge" },
        ]}
        navigate={navigate}
      />
      <div className="guide-page-layout">
      <GuideTableOfContents guide={challengeGuide} title="Challenge contents" />
      <div className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id="challenge-title" className="page-title">July Challenge: Paint your AI Hub</h1>
            <ChallengeStatusStrip {...JULY_CHALLENGE_STATUS} />
            <p>Use this page to complete the July challenge and submit the strongest version of your work.</p>
          </div>
        </div>
        <ChallengeWorkbench
          content={JULY_CONTENT}
          helpContext={CHALLENGE_HELP_CONTEXTS.july}
          guide={challengeGuide}
        />
      </div>
      </div>
    </section>
  );
}

function ChallengeGuidePage({ navigate }) {
  const challengeGuide = useMemo(() => getChallengeGuideModel(MONTH6_CONTENT.challenge), []);

  return (
    <section className="section page-section challenge-section guide-page-section" aria-labelledby="challenge-title">
      <Breadcrumbs
        items={[
          { label: "Past Workshops", path: "/past-workshops" },
          { label: "June", path: "/past-workshops/june" },
          { label: "Challenge" },
        ]}
        navigate={navigate}
      />
      <div className="guide-page-layout">
      <GuideTableOfContents guide={challengeGuide} title="Challenge contents" />
      <div className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id="challenge-title" className="page-title">Mastery Challenge #6: Build a Self-Improving Skill</h1>
            <p>Use this page to complete the June challenge and submit the strongest version of your work.</p>
          </div>
        </div>
        <ChallengeWorkbench
          content={MONTH6_CONTENT}
          helpContext={CHALLENGE_HELP_CONTEXTS.june || GUIDE_HELP_CONTEXTS.june}
          guide={challengeGuide}
        />
      </div>
      </div>
    </section>
  );
}

function SubmitPage({ breadcrumbs = [{ label: "Challenges", path: "/challenges" }, { label: "Submit" }], handleSubmit, navigate, submissionStatus, submissions, defaultMonth = "June" }) {
  return (
    <section className="section page-section" aria-labelledby="submit-title">
      <Breadcrumbs items={breadcrumbs} navigate={navigate} />
      <div className="split">
        <div>
          <p className="section-kicker">Challenge submission</p>
          <h1 id="submit-title" className="page-title">Submit your monthly Mastery challenge.</h1>
          <p className="muted">
            Share your project link, add a few notes for the team, and submit it for review.
          </p>
        </div>
        <form className="submission-card" onSubmit={handleSubmit}>
          <label>
            Challenge month
            <select name="month" defaultValue={defaultMonth}>
              {MONTHS.map((month) => (
                <option key={month.id}>{month.label}</option>
              ))}
            </select>
          </label>
          <label>
            Member name
            <input name="memberName" placeholder="Your name" required />
          </label>
          <label>
            Submission title
            <input name="title" placeholder="Name your challenge submission" required />
          </label>
          <label>
            Share link
            <input name="shareLink" type="url" placeholder="Paste your Loom, doc, or project link" required />
          </label>
          <label>
            Notes for the team
            <textarea name="notes" placeholder="What should we pay attention to?" />
          </label>
          <button type="submit">Submit challenge</button>
          {submissionStatus && <p className="submission-status">{submissionStatus}</p>}
          {submissions.length > 0 && (
            <div className="submission-queue" aria-label="Recent submissions">
              <strong>Recent submissions</strong>
              {submissions.slice(0, 3).map((submission) => (
                <a href={submission.share_link} key={submission.id} target="_blank" rel="noreferrer">
                  <span>{submission.month}</span>
                  {submission.title}
                </a>
              ))}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function TutorialPage({ navigate }) {
  function openTutorialUrl(event, url) {
    const destination = new URL(url, window.location.origin);
    const isMasteryHub = destination.hostname === window.location.hostname || destination.hostname === "mastery.aiadvantage.com";

    if (isMasteryHub) {
      event.preventDefault();
      navigate(`${destination.pathname}${destination.search}${destination.hash}`);
    }
  }

  return (
    <section className="section page-section tutorial-section" aria-labelledby="faq-title">
      <div className="section-heading">
        <p className="section-kicker">FAQ</p>
        <h1 id="faq-title" className="page-title">Start here when you open the Hub.</h1>
        <p className="muted">Use these shortcuts whenever you need the right place fast. Materials live here. Replays, live events, and community conversation live inside the AI Advantage Club.</p>
      </div>
      <div className="tutorial-grid">
        {TUTORIAL_QUICK_ACCESS.map((item, index) => {
          const primaryUrl = new URL(item.url, window.location.origin);
          const primaryIsHubUrl = primaryUrl.hostname === window.location.hostname || primaryUrl.hostname === "mastery.aiadvantage.com";

          return (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{item.eyebrow}</small>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <div className="tutorial-card-actions">
                <a
                  href={item.url}
                  onClick={(event) => openTutorialUrl(event, item.url)}
                  target={primaryIsHubUrl ? undefined : "_blank"}
                  rel={primaryIsHubUrl ? undefined : "noreferrer"}
                >
                  {item.action}
                </a>
                {item.secondaryUrl && (
                  <a href={item.secondaryUrl} target="_blank" rel="noreferrer">
                    {item.secondaryAction}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="tutorial-faq" aria-labelledby="tutorial-faq-title">
        <div className="section-heading compact">
          <p className="section-kicker">FAQ</p>
          <h2 id="tutorial-faq-title">The questions we get most often.</h2>
        </div>
        <div className="tutorial-faq-list">
          {TUTORIAL_FAQS.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{renderInlineMarkdown(item.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
