import React, { useEffect, useMemo, useRef, useState } from "react";
import { SignIn, SignUp, useClerk, useUser } from "@clerk/clerk-react";
import { supabase } from "./lib/supabase.js";
import { trackEvent, trackStepHelpClick } from "./lib/analytics.js";
import AdminBackend from "./admin/AdminBackend.jsx";
import { MONTH6_CONTENT } from "./month6Content.js";
import { JULY_CONTENT } from "./julyContent.js";
import { CHALLENGE_ARCHIVE } from "./data/challengeArchive.js";
import {
  ADD_PROMPT_LIBRARY_CARD_PROMPT,
  AGENTHUB_BUILDER_PROMPT,
  AGENTHUB_PROJECT_INSTRUCTIONS_PROMPT,
} from "./agentHubBuilderPrompt.js";

const CURRENT_MONTH_ID = "jul";
const JULY_PREREQUISITES_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1204164726?title=0&byline=0&portrait=0";
const JULY_GUIDE_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1206968779?title=0&byline=0&portrait=0";
const JULY_EXTRAS_VIDEO_EMBED_URL = "https://player.vimeo.com/video/1207545766?title=0&byline=0&portrait=0";

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
      caption: "Archive, guide, session prompts, and challenge in one path.",
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
      { type: "Recordings", title: "July Recordings", description: "Rewatch the July workshop sessions whenever you want to follow along again.", status: "Watch replay" },
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
const CURRENT_AND_UPCOMING_MONTHS = VISIBLE_MONTHS.filter((month, index) => index >= CURRENT_MONTH_INDEX);
const PAST_MONTHS = VISIBLE_MONTHS.filter((month, index) => index < CURRENT_MONTH_INDEX && month.available);
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

const HUB_FEATURES = [
  {
    name: "Current Workshop Resources",
    tag: "Resources",
    summary: "Everything from this month’s workshop.",
    includes: ["Slides", "Transcript", "Live Prompts", "Workshop Replay", "Q&A Replay"],
    path: "/monthly-resources/july",
    action: "Open Current Workshop Resources",
  },
  {
    name: "Current Challenge Resources",
    tag: "Apply",
    summary: "Find the task, submit your work, and see what other members built.",
    includes: ["Task", "Submission Link", "Judging/voting", "Showcase"],
    path: "/challenges/july",
    action: "Open Current Challenge Resources",
  },
  {
    name: "June Workshop Resources",
    tag: "Past month",
    summary: "Revisit the June workshop materials and challenge examples.",
    includes: ["June replay", "Paperwork guide", "Live materials", "Challenge submissions"],
    path: "/monthly-resources/june",
    scroll: "bottom",
    action: "Open June Resources",
  },
];

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

const ARCHIVE_ITEMS = [
  { month: "July", type: "Challenge", title: "Paint your AI Hub", status: "Open" },
  { month: "August", type: "Challenge", title: "Write Your Book", status: "Coming soon" },
  { month: "September", type: "Challenge", title: "AI Email Command Center", status: "Coming soon" },
];

const SUBMISSION_STORAGE_KEY = "mastery-hub-submissions";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/monthly-resources", label: "Monthly Resources" },
  { path: "/challenges", label: "Challenges" },
  { path: "/tutorial", label: "Tutorial" },
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
const CLAUDE_DESKTOP_URL = "https://claude.com/download";
const GITHUB_URL = "https://github.com/";
const LOVABLE_URL = "https://lovable.dev/";
const MASTERY_REPLAYS_URL = "https://community.aiadvantage.com/c/mastery-replays/";
const JULY_RECORDINGS_URL = "https://community.aiadvantage.com/c/mastery-replays?topics=528891";
const MASTERY_CALENDAR_URL = "https://community.aiadvantage.com/c/mastery-calendar/";
const CHALLENGE_SUBMISSIONS_URL = "https://community.aiadvantage.com/c/challenge-submissions/";
const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const PAST_SYSTEMS = [
  {
    id: "m1",
    month: "January",
    date: "Jan 6, 2026",
    theme: "Personal",
    system: "Personal AI Advisory Board",
    tools: "Custom GPTs, ChatGPT",
    difficulty: "Beginner",
    summary: "Members turned their DNA and decision history into a council of advisor personas inside a custom GPT.",
    igorComment: "The council of advisors idea still works, and today you can port it into Claude by importing the files and asking Claude to turn it into a skill.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-1-replay-build-your-personal-ai-advisory-board",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1?source=copy_link",
  },
  {
    id: "m2",
    month: "February",
    date: "Feb 3, 2026",
    theme: "Strategy",
    system: "Strategy Dashboard",
    tools: "Lovable, ChatGPT, Google AI Studio",
    difficulty: "Beginner",
    summary: "Members used their clone DNA and strategy prompts to build a hosted Lovable dashboard with charts and a chatbot.",
    igorComment: "This is still a great Lovable entry point, even if a few buttons look different now.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-2-replay-how-to-build-custom-business-tools-without-writing-a-single-line-of-code",
    resourceUrl: "https://aiadvantage.notion.site/Guide-2-DNA-to-Dashboard-2ed6426aaf6980038bb0fad729de8d87",
  },
  {
    id: "m3",
    month: "March",
    date: "Mar 3, 2026",
    theme: "Time",
    system: "Bulk Generation in Google Sheets",
    tools: "ChatGPT, Google Sheets, Gemini, Lovable",
    difficulty: "Beginner",
    summary: "Members used spreadsheet rows and AI formulas to generate personalized outputs in bulk from static data.",
    igorComment: "The bulk-work idea is useful, but today I would usually build this kind of repeated generation in Cowork instead of Sheets.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/march-strategy-amplifier-workshop",
    resourceUrl: "https://aiadvantage.notion.site/AI-Time-Tracker-Prompt-3196426aaf698024a6a3f72cb75494e6",
  },
  {
    id: "m4",
    month: "April",
    date: "Apr 7, 2026",
    theme: "Marketing",
    system: "Content Machine and Reusable Skill",
    tools: "Claude Cowork, ChatGPT, Notion, Zoom",
    difficulty: "Intermediate",
    summary: "Members built a scheduled Claude Cowork marketing employee that researched, drafted, reviewed, and packaged social content.",
    igorComment: "This is still a strong intro to Cowork, just treat the exact Cowork button clicks as flexible because the interface has shifted.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/april-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1",
  },
  {
    id: "m5",
    month: "May",
    date: "May 7, 2026",
    theme: "Sales",
    system: "Meeting Intelligence and Proposal Generator",
    tools: "Claude Cowork, Zoom, Fathom, Fireflies, Granola",
    difficulty: "Advanced",
    summary: "Members turned meeting transcripts into buying signals, proposals, follow-up drafts, and a reusable Claude workflow.",
    igorComment: "This is powerful if you already feel confident in Cowork and want to see how deep plugins and meeting workflows can go.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/may-ai-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/Guide-5-From-Meeting-to-Proposal-34c6426aaf6980a4ba24dee6ad8e591a",
  },
  {
    id: "m6",
    month: "June",
    date: "Jun 4, 2026",
    theme: "Operations",
    system: "Paperwork Autopilot",
    tools: "Claude Cowork",
    difficulty: "Intermediate",
    summary: "Members built a paperwork system that fills forms from a reusable profile and improves as missing information gets closed.",
    igorComment: "This is still very relevant, especially the challenge, and I recommend it once you are comfortable enough in Cowork to handle a self-improving system.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/june-mastery-replay",
    resourceUrl: "/monthly-resources/june",
  },
  {
    id: "m7",
    month: "July",
    date: "Jul 2, 2026",
    theme: "AI Hub",
    system: "Build Your Agent a Home",
    tools: "Claude Cowork, Lovable, GitHub",
    difficulty: "Advanced",
    summary: "Members built a private AI Hub that connects Cowork, GitHub, and Lovable so outputs, ideas, wins, and tools live in one place.",
    igorComment: "This connects Cowork, GitHub, and Lovable into one Hub, but Lovable makes it simple enough to customize, play around, and make it feel like yours.",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-july-2nd-replay",
    resourceUrl: "/monthly-resources/july",
  },
];

const TUTORIAL_QUICK_ACCESS = [
  {
    eyebrow: "Monthly Resources",
    title: "Start with current resources",
    description: "This is the current month hub. Start here for the prerequisites, guide, prompts, recordings, and workshop path.",
    url: "https://mastery.aiadvantage.com/monthly-resources",
    action: "Open monthly resources",
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
  {
    eyebrow: "Current Challenge",
    title: "Open the current challenge",
    description: "This is where the active challenge lives. Use it when you are ready to apply the month’s workshop and follow the submission steps.",
    url: "https://mastery.aiadvantage.com/challenges",
    action: "Open current challenge",
  },
  {
    eyebrow: "Past Challenge Archive",
    title: "Browse past submissions",
    description: "This is the archive for past months. Use it to see what members submitted, study examples, and borrow ideas for your own build.",
    url: "https://mastery.aiadvantage.com/archive",
    action: "Open archive",
  },
];

const TUTORIAL_FAQS = [
  {
    question: "Where should I start if I just opened the site?",
    answer: "Start with the current [Monthly Resources page](https://mastery.aiadvantage.com/monthly-resources). It keeps the guide, prerequisites, live materials, recordings link, and workshop path in one place so you are not hunting around.",
  },
  {
    question: "Where are the replays and upcoming live sessions?",
    answer: "Those live inside the [AI Advantage Club Mastery replays](https://community.aiadvantage.com/c/mastery-replays/) and the [Mastery calendar](https://community.aiadvantage.com/c/mastery-calendar/), not inside this Hub. Think of this site as your materials shelf. The Club is where the live rooms, replays, event posts, and community conversations happen.",
  },
  {
    question: "Where do I find the current challenge?",
    answer: "Go to [Challenges](https://mastery.aiadvantage.com/challenges), then open the current challenge. That page has the challenge, the submission path, the deadline, and the link into the [Challenge Submissions](https://community.aiadvantage.com/c/challenge-submissions/) space.",
  },
  {
    question: "Where can I see past challenge submissions?",
    answer: "Use the [challenge archive](https://mastery.aiadvantage.com/archive). This is where old month submissions should live, so you can learn from real examples without confusing them with the current challenge.",
  },
  {
    question: "Which old Mastery recordings should I watch first?",
    answer: "Use the Past Systems table at the bottom of the [Monthly Resources page](https://mastery.aiadvantage.com/monthly-resources). It shows the difficulty, what changed, and who I would recommend each old build for now.",
  },
  {
    question: "What if I am behind or missed last month?",
    answer: "Totally fine. Start with the [current month](https://mastery.aiadvantage.com/monthly-resources) first, then use the Past Systems table below when you want context or examples. You do not need to perfectly finish every old piece before you can participate now.",
  },
];

const HOME_SEARCH_ITEMS = [
  {
    title: "Current Workshop Resources",
    eyebrow: "Resources",
    description: "Slides, transcript, prompts, tools, templates, workshop replay, and Q&A replay.",
    path: "/monthly-resources/july",
    keywords: "current workshop resources slides transcript prompts tools templates replay q&a materials",
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
    title: "July Recordings",
    eyebrow: "Community replay",
    description: "Rewatch the July workshop sessions in the AI Advantage Club.",
    path: JULY_RECORDINGS_URL,
    keywords: "july recordings replays workshop q&a video community",
  },
  {
    title: "Current Challenge Resources",
    eyebrow: "Challenge",
    description: "Task, submission link, judging, voting, and showcase.",
    path: "/challenges/july",
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
    title: "June Workshop Resources",
    eyebrow: "Past month",
    description: "June replay, Paperwork guide, live materials, and challenge examples.",
    path: "/monthly-resources/june",
    scroll: "bottom",
    keywords: "june past workshop resources replay paperwork guide live materials challenge examples submissions",
  },
  {
    title: "Past Systems Swipe File",
    eyebrow: "Archive",
    description: "Concise guide to old Mastery builds, difficulty, recordings, and what Igor would recommend today.",
    path: "/archive/past-systems",
    keywords: "past systems swipe file recordings difficulty beginner intermediate advanced mastery months archive",
  },
  {
    title: "June Guide",
    eyebrow: "Past month",
    description: "The archived Paperwork guide from June.",
    path: "/monthly-resources/june/guide",
    keywords: "june guide paperwork forms claude skill archive",
  },
  {
    title: "June Challenge Archive",
    eyebrow: "Past challenge",
    description: "Browse June challenge submissions and examples.",
    path: "/archive/june",
    keywords: "june challenge archive submissions examples self-improving skill",
  },
  {
    title: "Tutorial",
    eyebrow: "Quick access",
    description: "Use the shortcut page when you need the right place fast.",
    path: "/tutorial",
    keywords: "tutorial quick access shortcuts resources replays events challenge archive",
  },
];

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

const JULY_EXTRAS_CONTENT = {
  video: {
    eyebrow: "Follow-up video",
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
      text: AGENTHUB_BUILDER_PROMPT,
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

const JULY_CHALLENGE_EXPLAINERS = {
  "Step 1: Put the idea on your board": "So basically, this step turns the redesign from a vague idea into a real card on your board.",
  "Step 2: Find your direction in Claude Cowork": "This is where Claude becomes your design director and turns your taste into a clear mobile-first direction.",
  "Step 3: Build it live in Lovable": "Now Lovable takes the brief and turns it into the first real version you can see and test.",
  "Step 4: Refine until it's yours": "This step is where you tune the look until it feels like something you would actually open every day.",
  "Step 5: Publish, then check your phone": "This is the reality check: publish it, open it on your phone, and fix anything that feels cramped or awkward.",
  "Step 6: Move it to Done and catch your Win": "This is the finish line: move the work to Done, capture the Win, and make the improvement visible.",
};

const BEFORE_START_ITEMS = [
  {
    label: "Your DNA files ready",
    detail: "Have your personal DNA and business DNA nearby. You will use them when the guide switches from Igor's demo files to your own files.",
  },
  {
    label: "Claude Pro, Max, or Team plan",
    detail: "Cowork is required for this workflow, so make sure you are signed into a Claude plan that includes it.",
  },
  {
    label: "Claude Desktop app installed",
    detail: "Install the desktop app before Step 1, then open the Cowork tab inside Claude.",
    link: CLAUDE_DESKTOP_URL,
    linkLabel: "Download Claude Desktop",
  },
  {
    label: "June Materials Bundle ZIP",
    detail: "Download the ZIP before Step 2. You will move it into your Paperwork folder and let Claude unpack it.",
    link: MONTH6_CONTENT.materialsUrl,
    linkLabel: "Download Materials Bundle ZIP",
  },
];

function getPath() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/monthly-hubs") return "/monthly-resources";
  if (path === "/challenge-archive") return "/archive";
  if (path === "/submit") return "/challenges/july";
  return path;
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
  const archiveRows = useMemo(
    () => [
      ...submissions.map((submission) => ({
        month: submission.month,
        type: "Member submission",
        title: submission.title,
        status: submission.status,
      })),
      ...ARCHIVE_ITEMS,
    ],
    [submissions]
  );

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
        if (!cancelled) setCmsMonths(data.months || []);
      } catch {
        if (!cancelled) setCmsMonths([]);
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
              className={item.path === "/" ? (path === "/" ? "active" : "") : (path.startsWith(item.path) ? "active" : "")}
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
        {!isAuthPath && isLayoutLabPath && <HomepageLayoutLab navigate={navigate} />}
        {!isAuthPath && path === "/" && <HomePage navigate={navigate} />}
        {!isAuthPath && path === "/admin" && <AdminBackend navigate={navigate} />}
        {!isAuthPath && path.startsWith("/monthly-resources") && (
          <MonthlyResourcesPage
            currentMonth={currentMonth}
            path={path}
            navigate={navigate}
            cmsMonths={cmsMonths}
          />
        )}
        {!isAuthPath && path.startsWith("/challenges") && (
          <ChallengesPage
            archiveRows={archiveRows}
            handleSubmit={handleSubmit}
            path={path}
            navigate={navigate}
            submissionStatus={submissionStatus}
            submissions={submissions}
            cmsMonths={cmsMonths}
          />
        )}
        {!isAuthPath && path.startsWith("/archive") && <ArchivePage path={path} navigate={navigate} />}
        {!isAuthPath && path === "/tutorial" && <TutorialPage navigate={navigate} />}
        {!isAuthPath && !isLayoutLabPath && path !== "/admin" && !path.startsWith("/monthly-resources") && !path.startsWith("/challenges") && !path.startsWith("/archive") && !NAV_ITEMS.some((item) => item.path === path) && <HomePage navigate={navigate} />}
      </main>
    </div>
  );
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
              appearance={clerkAppearance}
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

function HomePage({ navigate }) {
  const [mapGlow, setMapGlow] = useState({ x: 62, y: 34, active: false });
  const [searchQuery, setSearchQuery] = useState("");
  const currentMonth = CURRENT_MONTH;
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const terms = query.split(/\s+/).filter(Boolean);

    return HOME_SEARCH_ITEMS
      .map((item) => {
        const haystack = `${item.title} ${item.eyebrow} ${item.description} ${item.keywords}`.toLowerCase();
        const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 6);
  }, [searchQuery]);

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

  function handleCardKeyDown(event, destination, options = {}) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(destination, options);
    }
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
          <div
            className="hero-current-panel"
            aria-label="Current month"
            style={{ "--month-image": `url(${currentMonth.image.src})` }}
          >
            <div className="hero-current-copy">
              <span>{currentMonth.image.kicker}</span>
              <strong>{currentMonth.image.title}</strong>
              <small>{currentMonth.image.caption}</small>
              <button type="button" onClick={() => navigate("/monthly-resources/july")}>Open July</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-system" aria-labelledby="plans-title">
        <h2 id="plans-title" className="sr-only">AI Mastery resource tabs</h2>
        <div className="plan-grid">
          {HUB_FEATURES.map((feature) => (
            <article
              className="plan-card plan-card-clickable"
              key={feature.name}
              role="link"
              tabIndex={0}
              aria-label={`${feature.action}: ${feature.summary}`}
              onClick={() => navigate(feature.path, { scroll: feature.scroll })}
              onKeyDown={(event) => handleCardKeyDown(event, feature.path, { scroll: feature.scroll })}
            >
              <div className="plan-topline">
                <span>{feature.tag}</span>
              </div>
              <h3>{feature.name}</h3>
              <p>{feature.summary}</p>
              <ul>
                {feature.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                className="plan-card-action"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(feature.path, { scroll: feature.scroll });
                }}
              >
                {feature.action}
              </button>
            </article>
          ))}
        </div>
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
            <p>Monthly resources, challenges, and member examples, organized around what to do this month.</p>
            <div className="preview-actions">
              <button type="button" onClick={() => navigate("/monthly-resources")}>Open Monthly Resources</button>
              <button type="button" onClick={() => navigate("/challenges")}>Open Challenges</button>
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

function cmsMonthToContent(month) {
  return {
    guide: month.guide_markdown || "",
    challenge: month.challenge_markdown || "",
    challengePrompt: month.challenge_prompt || "",
    prompts: Array.isArray(month.prompts) ? month.prompts : [],
  };
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
  return {
    guideName: `AI Mastery ${month.label} ${isChallenge ? "Challenge" : "guide"}`,
    guideLink: `https://mastery.aiadvantage.com/${isChallenge ? "challenges" : "monthly-resources"}/${month.slug}${isChallenge ? "/guide" : "/guide"}`,
    overallGoal: month.outcome || month.focus || `Complete the ${month.label} Mastery month.`,
    aiInstruction: isChallenge
      ? "Help me complete this exact challenge step. Ask me for only the missing information you need. Keep the instructions practical and specific to this month."
      : "Help me complete this exact guide step. Ask me for only the missing information you need. Keep the instructions practical and specific to this month.",
  };
}

function MonthlyResourcesPage({ currentMonth, path, navigate, cmsMonths = [] }) {
  const segment = path.split("/")[2] || "";
  const cmsMonth = cmsMonths.find((month) => month.slug === segment);
  const staticMonth = MONTHS.find((month) => month.label.toLowerCase() === segment);

  if (path === "/monthly-resources") {
    return (
      <section className="section page-section month-section" aria-labelledby="months-title">
        <Breadcrumbs items={[{ label: "Monthly Resources" }]} navigate={navigate} />
        <div className="section-heading">
          <p className="section-kicker">Monthly resources</p>
          <h1 id="months-title" className="page-title">Choose your month.</h1>
          <p className="muted">Open the current month to find the guide prep materials. Future months unlock when they go live.</p>
        </div>
        <MonthChoiceSections
          activeId={CURRENT_MONTH_ID}
          basePath="/monthly-resources"
          navigate={navigate}
          cmsMonths={cmsMonths}
          currentTitle="Current and upcoming months"
          pastTitle="Past months"
        />
        <CmsMonthGroup months={cmsMonths} basePath="/monthly-resources" navigate={navigate} />
        <PastSystemsSection />
      </section>
    );
  }

  if (cmsMonth && segment !== "june" && segment !== "july") {
    if (path === `/monthly-resources/${segment}/guide`) {
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
        />
      );
    }

    if (path === `/monthly-resources/${segment}/prompts`) {
      return (
        <SessionPromptsPage
          navigate={navigate}
          content={cmsMonthToContent(cmsMonth)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle={`${cmsMonth.label} Live Materials`}
          lead="Copy each prompt into your AI workspace at the matching step of the guide."
          showMaterials={false}
        />
      );
    }

    if (path === `/monthly-resources/${segment}/extras`) {
      return (
        <SessionPromptsPage
          navigate={navigate}
          content={cmsExtrasToContent(cmsMonth)}
          monthLabel={cmsMonth.label}
          monthSlug={cmsMonth.slug}
          pageTitle={`${cmsMonth.label} Extras`}
          lead="Use these optional follow-up resources after the main workshop guide."
          breadcrumbLabel="Extras"
          sectionLabel="Extras"
          showMaterials={false}
        />
      );
    }

    return <CmsResourcesMenu month={cmsMonth} navigate={navigate} />;
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
      />
    );
  }

  if (path === "/monthly-resources/july/prerequisites") {
    return <JulyPrerequisitesPage navigate={navigate} />;
  }

  if (path.startsWith("/monthly-resources/july/guide/")) {
    return <RedirectRoute to="/monthly-resources/july/guide" navigate={navigate} />;
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
        sectionLabel="Follow up video"
        showMaterials={false}
      />
    );
  }

  if (path === "/monthly-resources/june/guide") {
    return <GuidePage navigate={navigate} />;
  }

  if (path.startsWith("/monthly-resources/june/guide/")) {
    return <RedirectRoute to="/monthly-resources/june/guide" navigate={navigate} />;
  }

  if (path === "/monthly-resources/june/prompts") {
    return <SessionPromptsPage navigate={navigate} />;
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
    <section className="section page-section archive-section">
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

function CmsResourcesMenu({ month, navigate }) {
  const displayMonth = cmsMonthToMonth(month);
  const hasPrompts = Array.isArray(month.prompts) && month.prompts.length > 0;
  const hasExtras = month.extras && Array.isArray(month.extras.prompts) && month.extras.prompts.length > 0;
  const resourceCards = Array.isArray(month.resources) ? month.resources.filter((item) => item?.title) : [];
  const groupedResources = resourceCards.reduce((groups, item) => {
    const category = item.category || "Workshop";
    groups[category] = [...(groups[category] || []), item];
    return groups;
  }, {});
  const categoryOrder = ["Workshop", "Extras", "Other", ...Object.keys(groupedResources).filter((category) => !["Workshop", "Extras", "Other"].includes(category))];

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
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: month.label },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={displayMonth}
        actionLabel="Open the Guide"
        onAction={() => navigate(`/monthly-resources/${month.slug}/guide`)}
        variant="banner"
      />
      {resourceCards.length > 0 ? (
        <div className="resource-category-stack">
          {categoryOrder.filter((category) => groupedResources[category]?.length).map((category) => (
            <section className="resource-category" key={category}>
              <div className="resource-category-head">
                <p className="section-kicker">{category}</p>
                <h3>{category === "Workshop" ? month.focus || "Workshop resources" : category === "Other" ? "Recordings and challenge" : "Coming next"}</h3>
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
                      <small>{item.status || "Open"}</small>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.description || "Open this month's resource."}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="resource-grid resource-grid-three">
          <button className="resource-card resource-card-button" type="button" onClick={() => navigate(`/monthly-resources/${month.slug}/guide`)}>
            <div className="resource-card-top">
              <span>Guide</span>
              <small>Step by step</small>
            </div>
            <h4>{month.label} Guide</h4>
            <p>{month.outcome || "Open the main written guide for this month."}</p>
          </button>
          <button className="resource-card resource-card-button" type="button" disabled={!hasPrompts} onClick={() => navigate(`/monthly-resources/${month.slug}/prompts`)}>
            <div className="resource-card-top">
              <span>Live materials</span>
              <small>{hasPrompts ? "Ready" : "Drafting"}</small>
            </div>
            <h4>Live Materials</h4>
            <p>Copy the prompts and templates that support this month's guide.</p>
          </button>
          <button className="resource-card resource-card-button" type="button" disabled={!hasExtras} onClick={() => navigate(`/monthly-resources/${month.slug}/extras`)}>
            <div className="resource-card-top">
              <span>Extras</span>
              <small>{hasExtras ? "Ready" : "Drafting"}</small>
            </div>
            <h4>Extras</h4>
            <p>Open optional follow-up resources, extra prompts, and supporting material.</p>
          </button>
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
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/archive/june")}>
          <div className="resource-card-top">
            <span>Challenge examples</span>
          </div>
          <h4>June Challenge Submissions</h4>
          <p>Browse the self-improving skill submissions and borrow ideas from what members built.</p>
        </button>
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
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "July" },
        ]}
        navigate={navigate}
      />
      <MonthVisualCard
        month={JULY_RESOURCE_BANNER}
        actionLinks={[
          { label: "Replay", href: JULY_RECORDINGS_URL },
          { label: "Guide", onClick: () => navigate("/monthly-resources/july/guide") },
          { label: "Prompts", onClick: () => navigate("/monthly-resources/july/prompts") },
          { label: "Challenge", onClick: () => navigate("/challenges/july") },
        ]}
        variant="banner"
      />
      <div className="resource-category-stack">
        <section className="resource-category" aria-labelledby="july-workshop-title">
          <div className="resource-category-head">
            <h3 id="july-workshop-title">Build the Hub</h3>
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
            <h3 id="july-challenge-category-title">Recordings and challenge</h3>
          </div>
          <div className="resource-grid resource-grid-two">
            <a className="resource-card resource-card-link" href={JULY_RECORDINGS_URL} target="_blank" rel="noreferrer">
              <div className="resource-card-top">
                <span>Recordings</span>
                <small>Community</small>
              </div>
              <h4>July Recordings</h4>
              <p>Rewatch the July workshop sessions whenever you want to follow along again.</p>
            </a>
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/challenges/july")}>
              <div className="resource-card-top">
                <span>Challenge</span>
                <small>Open</small>
              </div>
              <h4>July Challenge</h4>
              <p>Use what you built this month, submit your version, and see what other members made.</p>
            </button>
          </div>
        </section>

        <section className="resource-category" aria-labelledby="july-extras-title">
          <div className="resource-category-head">
            <h3 id="july-extras-title">Follow up video</h3>
          </div>
          <div className="resource-grid">
            <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/monthly-resources/july/extras")}>
              <div className="resource-card-top">
                <span>Video + Prompts</span>
                <small>Level up</small>
              </div>
              <h4>Go Deeper With Your AI Hub</h4>
              <p>Start here when you are ready to lock access to your email, publish, and build extra Hub apps.</p>
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function MonthVisualCard({ month = CURRENT_MONTH, actionLabel, actionLinks = [], onAction, variant = "" }) {
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
  showMaterials = true,
  customHelpContext,
}) {
  const guide = useMemo(() => getGuideModel(content.guide), [content]);
  const helpContext = customHelpContext || GUIDE_HELP_CONTEXTS[monthSlug] || GUIDE_HELP_CONTEXTS.june;

  return (
    <section className="section page-section month-section has-hover-toc" aria-labelledby="guide-title">
      <HoverTableOfContents title="Guide contents" items={guide.tocItems} />
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: monthLabel, path: `/monthly-resources/${monthSlug}` },
          { label: "Guide" },
        ]}
        navigate={navigate}
      />
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
          {monthSlug === "july" && (
            <article className="workbench-step guide-video-card" id="video-guide">
              <div className="workbench-step-top">
                <span>Video Guide</span>
              </div>
              <h3>Video Guide</h3>
              <p className="workbench-step-subtitle">
                Watch the walkthrough first, then use the written guide below when you want the exact steps, screenshots, and copy buttons.
              </p>
              <div className="video-embed" aria-label="July AI Hub video guide">
                <iframe
                  title="July AI Hub Video Guide"
                  src={JULY_GUIDE_VIDEO_EMBED_URL}
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
          {guide.steps.map((step, index) => (
            <article className="workbench-step" id={step.id} key={step.id}>
              <div className="workbench-step-top">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <StepHelpActions guide={guide} helpContext={helpContext} step={step} stepNumber={index + 1} />
              </div>
              {step.explainer && (
                <p className="workbench-step-explainer">{step.explainer}</p>
              )}
              <h3>{step.title}</h3>
              {!step.explainer && step.summary && (
                <p className="workbench-step-subtitle">{step.summary}</p>
              )}
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
      </section>
    </section>
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

const GUIDE_TOC_LABELS = {
  "Create Your GitHub and Lovable Accounts": "Create Accounts",
  "Set Up Lovable": "Set Up Lovable",
  "Connect Lovable to GitHub": "Connect GitHub",
  "Generate Your GitHub Token": "Generate Token",
  "Hand the Token and the Repository Name to Lovable": "Give Lovable the Token",
  "Set Up Your AgentHub Folder in Cowork": "Set Up AgentHub",
  "Connect Cowork to Your Repository": "Connect Cowork",
  "Create CLAUDE.md (The Standing Rule)": "Create CLAUDE.md",
  "Create a New Card for Daily Briefing": "Create Daily Briefing",
  "Use the Ideas + Wins Board": "Use Ideas + Wins",
  "You Did It! Next Steps": "Next Steps",
};

function guideTocLabel(label) {
  return GUIDE_TOC_LABELS[label] || label;
}

function guideTocItems(guide) {
  return [
    ...guide.introSections.map((section, index) => ({
      id: section.id,
      marker: index === 0 ? "Start" : "Prep",
      label: guideTocLabel(section.title),
      level: 1,
    })),
    ...guide.steps.map((step) => ({
      id: step.id,
      marker: String(step.stepNumber).padStart(2, "0"),
      label: guideTocLabel(step.shortTitle),
      level: 1,
    })),
    ...guide.closingSections.map((section) => ({
      id: section.id,
      marker: "End",
      label: guideTocLabel(section.title),
      level: 1,
    })),
  ];
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
    <Tag id={block.id}>
      {renderInlineMarkdown(block.text)}
    </Tag>
  );
}

function IntroSectionCard({ section, monthSlug = "june", navigate }) {
  const isBeforeStart = section.title === "Before You Start";
  const checklistItems = monthSlug === "july" ? JULY_PREREQUISITES : BEFORE_START_ITEMS;
  const checklistSubtitle = monthSlug === "july"
    ? "Get these six setup pieces ready before you start building your AI Hub."
    : "Get these four pieces ready before you start the Paperwork workflow.";

  if (!isBeforeStart) {
    return (
      <article className="workbench-step workbench-intro" id={section.id}>
        <div className="workbench-step-top">
          <span>Prep</span>
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
            {checklistSubtitle}
          </p>
        </div>
      </div>
      <BeforeStartChecklist items={checklistItems} navigate={navigate} />
    </article>
  );
}

function BeforeStartChecklist({ items = BEFORE_START_ITEMS, navigate }) {
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

function StepHelpActions({ guide, helpContext, step, stepNumber }) {
  const [status, setStatus] = useState("");
  const hideForJulyGuide = helpContext?.guideName === "AI Mastery July AI Hub guide"
    && [9].includes(stepNumber);

  if (hideForJulyGuide) {
    return null;
  }

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
      <button type="button" onClick={handleAiHelp}>Ask AI</button>
      <a href={MOD_HELP_URL} target="_blank" rel="noreferrer" onClick={handleModHelp}>Ask mods</a>
      {status && <span role="status">{status}</span>}
    </div>
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

function JulyPrerequisitesPage({ navigate }) {
  return (
    <section className="section page-section month-section" aria-labelledby="july-prerequisites-title">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: "July", path: "/monthly-resources/july" },
          { label: "Prerequisites" },
        ]}
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
}) {
  const prompts = content.prompts || [];
  const helpPrompt = prompts.find((prompt) => /^Prompt 5\b/.test(prompt.title || ""));
  const visiblePrompts = prompts.filter((prompt) => !/^Prompt 5\b/.test(prompt.title || ""));

  return (
    <section className="section page-section month-section" aria-labelledby="prompts-title">
      <Breadcrumbs
        items={[
          { label: "Monthly Resources", path: "/monthly-resources" },
          { label: monthLabel, path: `/monthly-resources/${monthSlug}` },
          { label: breadcrumbLabel },
        ]}
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
  return (
    <div className="month-choice-sections">
      <MonthChoiceGroup
        title={currentTitle}
        months={CURRENT_AND_UPCOMING_MONTHS}
        activeId={activeId}
        basePath={basePath}
        navigate={navigate}
        cmsMonths={cmsMonths}
      />
      {PAST_MONTHS.length > 0 && (
        <MonthChoiceGroup
          title={pastTitle}
          months={PAST_MONTHS}
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
        const isActive = month.id === activeId;
        const monthSlug = month.label.toLowerCase();
        const cmsMonth = cmsMonths.find((item) => item.slug === monthSlug);
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
          navigate(`${basePath}/${monthSlug}`);
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

function CopyPromptButton({ promptNumber }) {
  const [copied, setCopied] = useState(false);
  const prompt = (JULY_CONTENT.prompts || []).find((p) => {
    const title = p.title || "";
    return title.startsWith(`Prompt ${promptNumber}:`) || title.startsWith(`Prompt ${promptNumber} (`);
  });
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

function ChallengePromptButton() {
  const [copied, setCopied] = useState(false);
  const text = JULY_CONTENT.challengePrompt || "";
  if (!text) return null;

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
      {copied ? "✓ Copied to clipboard" : "📋 Copy Your Design Director"}
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

function MarkdownBlocks({ blocks }) {
  return (
    <div className="markdown-document markdown-document-embedded">
      {blocks.map((block, index) => <MarkdownBlock key={`${index}-${block.type}-${block.text?.slice(0, 12)}`} block={block} />)}
    </div>
  );
}

function MarkdownDocument({ content }) {
  const blocks = useMemo(() => blocksWithHeadingIds(content), [content]);

  return (
    <div className="markdown-document">
      {blocks.map((block, index) => <MarkdownBlock key={`${index}-${block.type}-${block.text?.slice(0, 12)}`} block={block} />)}
    </div>
  );
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

function ChallengeWorkbench({
  content,
  helpContext,
  explainers = {},
}) {
  const sections = useMemo(() => groupedMarkdownSections(content), [content]);
  const guide = useMemo(() => {
    const steps = sections.map((section, index) => {
      const heading = section.blocks[0];
      const title = section.title;
      return {
        id: heading?.id || sectionId(title),
        title,
        shortTitle: challengeTocLabel(title),
        stepNumber: index + 1,
        summary: explainers[title] || "",
        explainer: explainers[title] || "",
        blocks: section.blocks.slice(1),
      };
    });

    return {
      steps,
      fullContext: content,
    };
  }, [content, explainers, sections]);

  return (
    <div className="workbench-layout challenge-workbench-layout">
      <div className="workbench-stack">
        {guide.steps.map((step, index) => (
          <article className="workbench-step challenge-guide-card" id={step.id} key={step.id}>
            <div className="workbench-step-top">
              <small>{String(index + 1).padStart(2, "0")}</small>
              <StepHelpActions guide={guide} helpContext={helpContext} step={step} stepNumber={index + 1} />
            </div>
            {step.explainer && (
              <p className="workbench-step-explainer">{step.explainer}</p>
            )}
            <h3>{renderInlineMarkdown(step.title)}</h3>
            <MarkdownBlocks blocks={step.blocks} />
          </article>
        ))}
      </div>
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
    tocItems: guideTocItems({
      introSections: sections.filter((section) => introTitles.has(section.title)),
      steps,
      closingSections: sections
        .filter((section) => closingTitles.has(section.title))
        .map((section) => ({
          ...section,
          title: section.title === "Next Steps" ? "You Did It! Next Steps" : section.title,
        })),
    }),
    fullContext: content,
  };
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
  return [
    `Hi mods, I need help with the ${helpContext.guideName}.`,
    "",
    `Guide link: ${helpContext.guideLink}`,
    `Current location: Step ${stepNumber}: ${step.shortTitle}`,
    `What this step is for: ${step.summary}`,
    "",
    "What I need help with:",
    "[Write what happened, what you tried, and any extra context here. Add a screenshot if useful.]",
  ].join("\n");
}

function buildAiHelpMessage(guide, helpContext, step, stepNumber) {
  const stepList = guide.steps
    .map((item, index) => `${index + 1}. ${item.shortTitle}: ${item.summary}`)
    .join("\n");

  return [
    `You are helping me complete the ${helpContext.guideName}.`,
    "",
    "Overall guide goal:",
    helpContext.overallGoal,
    "",
    "All guide steps:",
    stepList,
    "",
    `My current location: Step ${stepNumber}: ${step.title}`,
    `What this step is for: ${step.summary}`,
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
  ].join("\n");
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

function MarkdownBlock({ block }) {
  if (block.type === "space") return <div className="md-space" />;
  if (block.type === "rule") return <hr className="md-rule" />;
  if (block.type === "code") return <CopyableCodeBlock text={block.text} />;
  if (block.type === "image") {
    const figureClassName = [
      "md-figure",
      block.src === "/july/ch7-18.png" ? "md-figure-compact-phone" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <figure className={figureClassName}>
        <img className="md-image" src={block.src} alt={block.alt} loading="lazy" />
        {block.alt && <figcaption>{block.alt}</figcaption>}
      </figure>
    );
  }
  if (block.type === "copy-prompt") return <CopyPromptButton promptNumber={block.prompt} />;
  if (block.type === "copy-challenge-prompt") return <ChallengePromptButton />;
  if (block.type === "h3" || block.type === "h4" || block.type === "h5") return <MarkdownHeading block={block} />;
  if (block.type === "quote") return <blockquote className="md-quote">{renderInlineMarkdown(block.text)}</blockquote>;
  if (block.type === "check") return <p className="md-check">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "bullet") return <p className="md-bullet">{renderInlineMarkdown(block.text)}</p>;
  if (block.type === "step") return <p className="md-step">{renderInlineMarkdown(block.text)}</p>;
  return <p>{renderInlineMarkdown(block.text)}</p>;
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

function ArchivePage({ path, navigate }) {
  const archiveMonths = CHALLENGE_ARCHIVE.months;
  const segment = path.split("/")[2] || "";
  const selectedMonth = archiveMonths.find((month) => month.label.toLowerCase() === segment || month.id === segment);

  if (path === "/archive/past-systems") {
    return <PastSystemsPage navigate={navigate} />;
  }

  if (path === "/archive" || !selectedMonth) {
    return (
      <section className="section page-section archive-section" aria-labelledby="archive-home-title">
        <Breadcrumbs items={[{ label: "Archive" }]} navigate={navigate} />
        <div className="section-heading">
          <p className="section-kicker">Archive</p>
          <h1 id="archive-home-title" className="page-title">Find the right past material fast.</h1>
          <p className="muted">Start with the systems swipe file when you want to know what is still worth replaying, then open challenge archives when you want member examples.</p>
        </div>
        <div className="archive-entry-grid" aria-label="Archive sections">
          <button type="button" className="archive-entry-card" onClick={() => navigate("/archive/past-systems")}>
            <span>Swipe file</span>
            <strong>Past Systems and Recordings</strong>
            <small>Traffic-light guidance for Months 1 through 7.</small>
          </button>
          <button type="button" className="archive-entry-card" onClick={() => navigate("/archive/june")}>
            <span>Challenge examples</span>
            <strong>Past Challenge Submissions</strong>
            <small>June is loaded now. More months join after each challenge closes.</small>
          </button>
        </div>
        <div className="section-heading archive-subheading">
          <p className="section-kicker">Challenge archive</p>
          <h2 className="page-title">Choose a challenge month.</h2>
        </div>
        <ArchiveMonthGrid months={archiveMonths} navigate={navigate} />
      </section>
    );
  }

  return <ArchiveMonthPage month={selectedMonth} navigate={navigate} />;
}

function PastSystemsPage({ navigate }) {
  return (
    <section className="section page-section archive-section systems-archive-section" aria-labelledby="past-systems-title">
      <Breadcrumbs
        items={[
          { label: "Archive", path: "/archive" },
          { label: "Past Systems" },
        ]}
        navigate={navigate}
      />
      <div className="archive-hero systems-hero">
        <div>
          <p className="section-kicker">Swipe file</p>
          <h1 id="past-systems-title" className="page-title">Past Mastery systems and recordings.</h1>
          <p className="muted">Use this before rewatching old months. The goal is simple: know what each month built, how hard it is, and whether I would still recommend copying that system today.</p>
        </div>
      </div>

      <PastSystemsTable />
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
          <span role="columnheader">Difficulty</span>
          <span role="columnheader">Summary</span>
          <span role="columnheader">Igor's comment</span>
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
        <span>{item.date}</span>
        <small>{item.theme}</small>
      </div>
      <div className="systems-system" role="cell">
        <strong>{item.system}</strong>
        <span>{item.tools}</span>
      </div>
      <div role="cell">
        <span className={`system-difficulty-pill system-difficulty-pill-${item.difficulty.toLowerCase()}`}>
          {item.difficulty}
        </span>
      </div>
      <p role="cell">{item.summary}</p>
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

function ArchiveMonthGrid({ months, navigate }) {
  return (
    <div className="archive-month-grid" aria-label="Archive months">
      {months.map((month) => {
        const hasSubmissions = month.submissionCount > 0;
        return (
          <button
            key={month.id}
            type="button"
            className={`archive-month-card ${hasSubmissions ? "ready" : "empty"}`}
            onClick={() => navigate(`/archive/${month.label.toLowerCase()}`)}
          >
            <span>{month.label}</span>
            <strong>{month.theme}</strong>
            <small>{hasSubmissions ? `${month.submissionCount} submissions` : "Ready after this challenge closes"}</small>
          </button>
        );
      })}
    </div>
  );
}

function ArchiveMonthPage({ month, navigate }) {
  const [activeInterest, setActiveInterest] = useState("All");
  const [query, setQuery] = useState("");

  const visibleSubmissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return month.submissions.filter((submission) => {
      const matchesInterest = activeInterest === "All" || submission.interests.includes(activeInterest);
      if (!matchesInterest) return false;
      if (!q) return true;
      return [submission.title, submission.author, submission.summary, ...(submission.interests || [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [activeInterest, month.submissions, query]);

  const hasSubmissions = month.submissionCount > 0;

  return (
    <section className="section page-section archive-section archive-detail" aria-labelledby="archive-month-title">
      <Breadcrumbs
        items={[
          { label: "Archive", path: "/archive" },
          { label: month.label },
        ]}
        navigate={navigate}
      />
      <div className="archive-hero">
        <div>
          <p className="section-kicker">{month.label} archive</p>
          <h1 id="archive-month-title" className="page-title">{month.title}</h1>
          <p className="muted">{month.description}</p>
        </div>
        <div className="archive-stats" aria-label={`${month.label} archive stats`}>
          <span><strong>{month.submissionCount}</strong> submissions</span>
          <span><strong>{month.rawPostCount}</strong> Circle posts checked</span>
          <span><strong>{month.excludedPostCount}</strong> excluded</span>
        </div>
      </div>

      {!hasSubmissions && (
        <div className="archive-empty">
          <h2>{month.label} is ready for submissions.</h2>
          <p>The monthly archive shell is in place. When this challenge closes, run the Circle scrape and add the month dataset here.</p>
        </div>
      )}

      {hasSubmissions && (
        <>
          <div className="archive-controls" aria-label="Archive filters">
            <label>
              Search submissions
              <input
                type="search"
                value={query}
                placeholder="Search title, author, summary..."
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="archive-filter-chips" aria-label="Interest filters">
              {month.interestCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === activeInterest ? "active" : ""}
                  onClick={() => setActiveInterest(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="archive-submission-grid" aria-live="polite">
            {visibleSubmissions.map((submission) => (
              <ArchiveSubmissionCard submission={submission} key={submission.id} />
            ))}
          </div>

          {visibleSubmissions.length === 0 && (
            <p className="archive-no-results">No submissions match that filter yet.</p>
          )}
        </>
      )}
    </section>
  );
}

function ArchiveSubmissionCard({ submission }) {
  const preview = submission.displayImages?.[0];

  return (
    <article className="archive-submission-card">
      {preview ? (
        <img className="archive-submission-image" src={preview.src} alt={preview.alt} loading="eager" />
      ) : (
        <div className="archive-submission-image archive-submission-placeholder">
          <span>{submission.author?.slice(0, 1) || "M"}</span>
        </div>
      )}
      <div className="archive-submission-body">
        <h2>{submission.title}</h2>
        <p className="archive-author">{submission.author}</p>
        <p>{submission.summary}</p>
        <div className="archive-interest-row">
          {submission.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
        <a className="archive-source-link" href={submission.url} target="_blank" rel="noreferrer">
          Open Circle post
        </a>
      </div>
    </article>
  );
}

function ChallengesPage({ archiveRows, handleSubmit, path, navigate, submissionStatus, submissions, cmsMonths = [] }) {
  const segment = path.split("/")[2] || "";
  const child = path.split("/")[3] || "";
  const cmsMonth = cmsMonths.find((month) => month.slug === segment);

  if (path === "/challenges") {
    return (
      <section className="section page-section archive-section" aria-labelledby="challenges-title">
        <Breadcrumbs items={[{ label: "Challenges" }]} navigate={navigate} />
        <div className="section-heading">
          <p className="section-kicker">Challenges</p>
          <h1 id="challenges-title" className="page-title">Choose your challenge month.</h1>
          <p className="muted">Open the current month to find the challenge, submit your work, and review submissions. Future challenges unlock when they go live.</p>
        </div>
        <MonthChoiceSections
          activeId={CURRENT_MONTH_ID}
          basePath="/challenges"
          navigate={navigate}
          cmsMonths={cmsMonths}
          currentTitle="Current and upcoming challenges"
          pastTitle="Past challenges"
        />
        <CmsMonthGroup months={cmsMonths} basePath="/challenges" navigate={navigate} />
      </section>
    );
  }

  if (segment === "june") {
    const juneMonth = MONTHS.find((item) => item.id === "jun") || MONTHS[0];
    if (child === "guide") return <ChallengeGuidePage navigate={navigate} />;
    if (child === "submit" || child === "submissions") return <RedirectRoute to="/archive/june" navigate={navigate} />;
    return <JuneChallengeLanding month={juneMonth} navigate={navigate} />;
  }

  if (segment !== "july") {
    if (cmsMonth) {
      if (child === "guide") return <CmsChallengeGuidePage month={cmsMonth} navigate={navigate} />;
      if (child === "submit" || child === "submissions") return <ExternalRedirectRoute to={CHALLENGE_SUBMISSIONS_URL} />;
      return <CmsChallengeLanding month={cmsMonth} navigate={navigate} />;
    }

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
      <section className="section page-section archive-section">
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
  if (child === "submit" || child === "submissions") return <ExternalRedirectRoute to={CHALLENGE_SUBMISSIONS_URL} />;
  return <JulyChallengeLanding navigate={navigate} />;
}

function CmsChallengeLanding({ month, navigate }) {
  const displayMonth = cmsMonthToMonth({
    ...month,
    hero: {
      ...(month.hero || {}),
      kicker: "Published challenge",
      title: `${month.label} Challenge`,
    },
  });

  return (
    <section className="section page-section archive-section" aria-labelledby={`${month.slug}-challenge-title`}>
      <Breadcrumbs items={[{ label: "Challenges", path: "/challenges" }, { label: month.label }]} navigate={navigate} />
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

function CmsChallengeGuidePage({ month, navigate }) {
  const challenge = month.challenge_markdown || "";
  const tocItems = useMemo(() => markdownTocItems(challenge), [challenge]);

  return (
    <section className="section page-section month-section has-hover-toc" aria-labelledby={`${month.slug}-challenge-guide-title`}>
      <HoverTableOfContents title="Challenge contents" items={tocItems} />
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: month.label, path: `/challenges/${month.slug}` },
          { label: "Challenge" },
        ]}
        navigate={navigate}
      />
      <div className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id={`${month.slug}-challenge-guide-title`} className="page-title">{month.label} Challenge</h1>
            <p>{month.outcome || "Use this page to complete the monthly challenge and submit your work."}</p>
          </div>
        </div>
        <ChallengeWorkbench
          content={challenge}
          helpContext={cmsGuideHelpContext(month, "challenge")}
        />
      </div>
    </section>
  );
}

function CurrentChallengeComingSoon({ month, navigate }) {
  return (
    <section className="section page-section archive-section" aria-labelledby="july-challenge-title">
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
    <section className="section page-section archive-section" aria-labelledby="july-challenge-title">
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
        <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Submit</span>
            <small>Community</small>
          </div>
          <h4>Post to Challenge Submissions</h4>
          <p>Post your before and after, your direction, and your design brief in the Challenge Submissions space.</p>
        </a>
        <a className="resource-card resource-card-link" href={CHALLENGE_SUBMISSIONS_URL} target="_blank" rel="noreferrer">
          <div className="resource-card-top">
            <span>Submissions</span>
            <small>Community</small>
          </div>
          <h4>Recent Submissions</h4>
          <p>Browse recent member challenge posts directly in the AI Advantage Community.</p>
        </a>
      </div>
    </section>
  );
}

function JuneChallengeLanding({ month, navigate }) {
  return (
    <section className="section page-section archive-section" aria-labelledby="june-challenge-title">
      <Breadcrumbs items={[{ label: "Challenges", path: "/challenges" }, { label: "June" }]} navigate={navigate} />
      <div className="section-heading section-heading-compact">
        <h1 id="june-challenge-title" className="page-title">Build a Self-Improving Skill</h1>
      </div>
      <MonthVisualCard
        month={month}
        actionLabel="Open June Archive"
        onAction={() => navigate("/archive/june")}
      />
      <div className="resource-grid">
        <button className="resource-card resource-card-button" type="button" onClick={() => navigate("/archive/june")}>
          <div className="resource-card-top">
            <span>Archive</span>
            <small>20 submissions</small>
          </div>
          <h4>June Challenge Archive</h4>
          <p>Browse the member submissions from the Self-Improving Skill challenge, with filters, summaries, screenshots, and Circle links.</p>
        </button>
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

function JulyChallengeGuidePage({ navigate }) {
  const tocItems = useMemo(() => markdownTocItems(JULY_CONTENT.challenge), []);
  return (
    <section className="section page-section month-section has-hover-toc" aria-labelledby="archive-title">
      <HoverTableOfContents title="Challenge contents" items={tocItems} />
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "July", path: "/challenges/july" },
          { label: "Challenge" },
        ]}
        navigate={navigate}
      />
      <div className="resource-section guide-workbench-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id="archive-title" className="page-title">July Challenge: Paint your AI Hub</h1>
            <p>Use this page to complete the July challenge and submit the strongest version of your work.</p>
          </div>
        </div>
        <ChallengeWorkbench
          content={JULY_CONTENT.challenge}
          helpContext={CHALLENGE_HELP_CONTEXTS.july}
          explainers={JULY_CHALLENGE_EXPLAINERS}
        />
      </div>
    </section>
  );
}

function ChallengeGuidePage({ navigate }) {
  const tocItems = useMemo(() => markdownTocItems(MONTH6_CONTENT.challenge), []);

  return (
    <section className="section page-section archive-section has-hover-toc" aria-labelledby="archive-title">
      <HoverTableOfContents title="Challenge contents" items={tocItems} />
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: "June", path: "/challenges/june" },
          { label: "Challenge" },
        ]}
        navigate={navigate}
      />
      <div className="resource-section">
        <div className="resource-section-head">
          <div>
            <p className="section-kicker">Challenge</p>
            <h1 id="archive-title" className="page-title">Mastery Challenge #6: Build a Self-Improving Skill</h1>
            <p>Use this page to complete the June challenge and submit the strongest version of your work.</p>
          </div>
        </div>
        <MarkdownSectionCards content={MONTH6_CONTENT.challenge} />
      </div>
    </section>
  );
}

function ChallengeSubmissionsPage({ archiveRows, navigate, monthLabel = "June" }) {
  const visibleRows = archiveRows.filter((item) => item.month === monthLabel);
  const rows = visibleRows.length > 0 ? visibleRows : archiveRows;

  return (
    <section className="section page-section archive-section" aria-labelledby="archive-title">
      <Breadcrumbs
        items={[
          { label: "Challenges", path: "/challenges" },
          { label: monthLabel, path: `/challenges/${monthLabel.toLowerCase()}` },
          { label: "Submissions" },
        ]}
        navigate={navigate}
      />
      <div className="section-heading">
        <p className="section-kicker">Submissions</p>
        <h1 id="archive-title" className="page-title">{monthLabel} challenge submissions.</h1>
        <p className="muted">Use the archive to revisit past challenges, review your own work, and learn from standout member examples.</p>
      </div>
      <div className="archive-table" role="table" aria-label="Challenge archive">
        <div className="archive-row archive-head" role="row">
          <span>Month</span>
          <span>Type</span>
          <span>Collection</span>
          <span>Status</span>
        </div>
        {rows.map((item) => (
          <div className="archive-row" role="row" key={`${item.month}-${item.title}`}>
            <span>{item.month}</span>
            <span>{item.type}</span>
            <span>{item.title}</span>
            <span>{item.status}</span>
          </div>
        ))}
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
    <section className="section page-section tutorial-section" aria-labelledby="tutorial-title">
      <div className="section-heading">
        <p className="section-kicker">Tutorial</p>
        <h1 id="tutorial-title" className="page-title">Start here when you open the Hub.</h1>
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
