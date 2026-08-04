import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JULY_CONTENT } from "../src/julyContent.js";
import { MONTH6_CONTENT } from "../src/month6Content.js";

const AGENTHUB_PROJECT_INSTRUCTIONS_PROMPT = (await readFile(
  fileURLToPath(new URL("../src/agentHubProjectInstructions.md", import.meta.url)),
  "utf8",
)).trim();
const ADD_PROMPT_LIBRARY_CARD_PROMPT = "Add a prompt library card to my Hub.";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORCE = process.argv.includes("--force");

function serviceProjectUrl(serviceKey) {
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64url").toString("utf8"));
    return payload.ref ? `https://${payload.ref}.supabase.co` : "";
  } catch {
    return "";
  }
}

const configuredUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_URL = /^https?:\/\//i.test(configuredUrl) ? configuredUrl : serviceProjectUrl(SERVICE_KEY || "");

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("VITE_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function publishedResource(resource) {
  return {
    status: "published",
    is_published: true,
    ...resource,
  };
}

const legacyMonths = [
  {
    slug: "january",
    label: "January",
    published_at: "2026-01-06T12:00:00.000Z",
    topic: "Personal",
    focus: "Build Your Personal AI Advisory Board",
    outcome: "Turn your DNA and decision history into a council of advisor personas inside a custom GPT.",
    tools: "Custom GPTs, ChatGPT",
    difficulty: "Beginner",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-1-replay-build-your-personal-ai-advisory-board",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1?source=copy_link",
  },
  {
    slug: "february",
    label: "February",
    published_at: "2026-02-03T12:00:00.000Z",
    topic: "Strategy",
    focus: "Build Custom Business Tools",
    outcome: "Use your clone DNA and strategy prompts to build a hosted dashboard with charts and a chatbot.",
    tools: "Lovable, ChatGPT, Google AI Studio",
    difficulty: "Beginner",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/mastery-workshop-2-replay-how-to-build-custom-business-tools-without-writing-a-single-line-of-code",
    resourceUrl: "https://aiadvantage.notion.site/Guide-2-DNA-to-Dashboard-2ed6426aaf6980038bb0fad729de8d87",
  },
  {
    slug: "march",
    label: "March",
    published_at: "2026-03-03T12:00:00.000Z",
    topic: "Time",
    focus: "Turn Your Expertise Into AI Workflows",
    outcome: "Teach AI your personal decision-making process.",
    tools: "ChatGPT, Google Sheets, Gemini, Lovable",
    difficulty: "Beginner",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/march-strategy-amplifier-workshop",
    resourceUrl: "https://aiadvantage.notion.site/AI-Time-Tracker-Prompt-3196426aaf698024a6a3f72cb75494e6",
  },
  {
    slug: "april",
    label: "April",
    published_at: "2026-04-07T12:00:00.000Z",
    topic: "Marketing",
    focus: "Create Content, Visuals, and Marketing Assets With AI",
    outcome: "Build a Claude marketing employee that can research, draft, and review content.",
    tools: "Claude Cowork, ChatGPT, Notion, Zoom",
    difficulty: "Intermediate",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/april-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/AI-Advantage-Mastery-Interactive-Resources-Hub-2e06426aaf698045bb76e360377ba5d1",
  },
  {
    slug: "may",
    label: "May",
    published_at: "2026-05-07T12:00:00.000Z",
    topic: "Sales",
    focus: "Automate Your Sales Follow-Ups",
    outcome: "Turn meeting transcripts into proposals, follow-up drafts, and a reusable workflow.",
    tools: "Claude Cowork, Zoom, Fathom, Fireflies, Granola",
    difficulty: "Advanced",
    replayUrl: "https://community.aiadvantage.com/c/mastery-replays/may-ai-mastery-replay",
    resourceUrl: "https://aiadvantage.notion.site/Guide-5-From-Meeting-to-Proposal-34c6426aaf6980a4ba24dee6ad8e591a",
  },
];

const basicArchiveRows = legacyMonths.map((month, index) => ({
  slug: month.slug,
  label: month.label,
  month_number: month.label,
  topic: month.topic,
  focus: month.focus,
  outcome: month.outcome,
  hero: {
    src: `/month6/alternates/month6-paperwork-alt-${(index % 3) + 1}.png`,
    alt: `${month.label} Mastery workshop`,
    kicker: "Past workshop",
    title: `${month.label}: ${month.focus}`,
    caption: month.outcome,
  },
  resources: [
    publishedResource({
      category: "Workshop",
      type: "Replay",
      title: `${month.label} Replay`,
      description: "Watch the workshop recording in the AI Advantage Club.",
      url: month.replayUrl,
    }),
    publishedResource({
      category: "Workshop",
      type: "Resources",
      title: `${month.label} Resources`,
      description: "Open the original workshop resources for this month.",
      url: month.resourceUrl,
    }),
  ],
  guide_markdown: "",
  challenge_markdown: "",
  challenge_prompt: "",
  prompts: [],
  extras: {},
  admin_notes: `Imported from the legacy Past Systems archive. Tools: ${month.tools}. Difficulty: ${month.difficulty}.`,
  status: "published",
  is_published: true,
  published_at: month.published_at,
  updated_by: "Archive migration",
}));

const june = {
  slug: "june",
  label: "June",
  month_number: "June",
  topic: "Operations",
  focus: "Build an AI Paperwork Assistant",
  outcome: "Build a paperwork system that fills forms from a reusable profile and then improves itself.",
  hero: {
    src: "/month6/alternates/month6-paperwork-alt-1.png",
    alt: "A paperwork form preview used for June",
    kicker: "Past workshop",
    title: "June: Paperwork",
    caption: "Replay, guide, challenge, and challenge submissions in one path.",
  },
  resources: [
    publishedResource({
      category: "Workshop",
      type: "Replay",
      title: "June Replay",
      description: "Watch the June workshop recording in the AI Advantage Club.",
      url: "https://community.aiadvantage.com/c/mastery-replays/june-mastery-replay",
    }),
    publishedResource({
      category: "Workshop",
      type: "Walkthrough",
      title: "June Resources",
      description: "Open the complete Paperwork guide with the live prompts and materials.",
      url: "/monthly-resources/june/guide",
    }),
    publishedResource({
      category: "Challenge",
      type: "Challenge",
      title: "Build a Self-Improving Skill",
      description: "Read the full mission, workflow, deliverables, working prompt, and submission requirements.",
      url: "/challenges/june/guide",
    }),
    publishedResource({
      category: "Challenge",
      type: "Submissions",
      title: "June Challenge Submissions",
      description: "Browse the member projects submitted for the Self-Improving Skill challenge.",
      url: "https://community.aiadvantage.com/c/challenge-submissions/",
    }),
  ],
  guide_markdown: MONTH6_CONTENT.guide || "",
  challenge_markdown: MONTH6_CONTENT.challenge || "",
  challenge_prompt: MONTH6_CONTENT.challengePrompt || "",
  prompts: MONTH6_CONTENT.prompts || [],
  extras: {},
  admin_notes: "Migrated from the original Month 6 source. Workshop and Challenge card groups match the July archive standard.",
  status: "published",
  is_published: true,
  published_at: "2026-06-04T12:00:00.000Z",
  updated_by: "Archive migration",
};

const julyExtras = {
  video: {
    eyebrow: "Follow up resources",
    title: "Go Deeper With Your AI Agent Hub",
    intro: "Publish the Hub, protect it behind login, expand it with new cards, and personalize it over time.",
    src: "https://player.vimeo.com/video/1207545766?title=0&byline=0&portrait=0",
    ariaLabel: "July AI Agent Hub follow-up video",
  },
  prompts: [
    {
      title: "Restrict Access to One Email",
      text: "Only allow this address: [YOUR-EMAIL@gmail.com]\nMake all pages inaccessible unless the user is logged in from a clean login screen.",
    },
    { title: "Agent Hub Project Instructions", text: AGENTHUB_PROJECT_INSTRUCTIONS_PROMPT },
    {
      title: "Skill: AgentHub Builder",
      description: "Download this Claude skill and install it so Claude can add cards, prompt libraries, and AI tools to your hub.",
      file: "/july/agenthub-builder.skill",
      filename: "agenthub-builder.skill",
      downloadLabel: "Download skill",
      summaryLabel: "Skill file",
    },
    { title: "Add a prompt library card to my hub", text: ADD_PROMPT_LIBRARY_CARD_PROMPT },
  ],
};

const july = {
  slug: "july",
  label: "July",
  month_number: "July",
  topic: "AI Hub",
  focus: "Build Your AI Hub",
  outcome: "Build your own private AI Hub website where everything your AI creates shows up, with Lovable, GitHub, and Claude Cowork wired together.",
  hero: {
    src: "/july/july-ai-hub-card-relatable-3.png",
    alt: "A warm home-office desk with a tablet, phone, checklist, coffee, and papers for the July AI Hub",
    kicker: "Past workshop",
    title: "July: Build Your AI Hub",
    caption: "",
  },
  resources: [
    publishedResource({ category: "Workshop", type: "Replay", title: "July Replay", description: "Watch the July workshop recording in the AI Advantage Club.", url: "https://community.aiadvantage.com/c/mastery-replays/mastery-july-2nd-replay" }),
    publishedResource({ category: "Workshop", type: "Checklist", title: "Before You Start", description: "Make sure the accounts, apps, and files you need for the July workshop are ready.", url: "/monthly-resources/july/prerequisites" }),
    publishedResource({ category: "Workshop", type: "Walkthrough", title: "July Guide", description: "Follow the full walkthrough to build your Hub and connect the main pieces.", url: "/monthly-resources/july/guide" }),
    publishedResource({ category: "Workshop", type: "Copy-paste", title: "Live Prompts", description: "Use these alongside the live workshop when you just need the prompts to follow each step.", url: "/monthly-resources/july/prompts" }),
    publishedResource({ category: "Challenge", type: "Challenge", title: "July Challenge", description: "Read the full mission, rules, deliverables, deadline, and the Design Director prompt.", url: "/challenges/july/guide" }),
    publishedResource({ category: "Challenge", type: "Submissions", title: "Challenge Submission Registry", description: "Browse the July challenge submissions with summaries, visual previews, and filters.", url: "/monthly-resources/july/challenge-submissions" }),
    publishedResource({ category: "Other", type: "Video + Prompts", title: "Go Deeper With Your AI Hub", description: "Lock access, publish cleanly, and build extra Hub apps.", url: "/monthly-resources/july/extras" }),
    publishedResource({ category: "Other", type: "FAQ", title: "FAQ & Catchup", description: "Review the July catch-up answers, next steps, and prompts.", url: "/monthly-resources/july/faq-catchup" }),
  ],
  guide_markdown: JULY_CONTENT.guide || "",
  challenge_markdown: JULY_CONTENT.challenge || "",
  challenge_prompt: JULY_CONTENT.challengePrompt || "",
  prompts: JULY_CONTENT.prompts || [],
  extras: julyExtras,
  admin_notes: "Migrated from the original Month 7 source. This is the archive page organization template for every month.",
  status: "published",
  is_published: true,
  published_at: "2026-07-02T12:00:00.000Z",
  updated_by: "Archive migration",
};

const rows = [...basicArchiveRows, june, july];
const slugs = rows.map((row) => row.slug);
const { data: existing, error: existingError } = await supabase
  .from("mastery_month_drafts")
  .select("slug")
  .in("slug", slugs);
if (existingError) throw existingError;

const existingSlugs = new Set((existing || []).map((row) => row.slug));
const rowsToWrite = FORCE ? rows : rows.filter((row) => !existingSlugs.has(row.slug));

if (!rowsToWrite.length) {
  console.log("Past months already exist. Nothing changed.");
  process.exit(0);
}

const { error } = await supabase
  .from("mastery_month_drafts")
  .upsert(rowsToWrite, { onConflict: "slug" });
if (error) throw error;

console.log(`Seeded ${rowsToWrite.length} archive month(s): ${rowsToWrite.map((row) => row.label).join(", ")}`);
