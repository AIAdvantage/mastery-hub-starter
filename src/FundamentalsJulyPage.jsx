import React, { useState } from "react";

const SECTIONS = [
  {
    id: "map",
    number: "01",
    minutes: 10,
    title: "You're not behind. Here's the map.",
    aim: "Give everyone a simple mental model before opening any tools.",
    talkingPoints: [
      "Chat helps you think and create one response at a time.",
      "Cowork completes multi-step work using files and folders.",
      "Lovable turns plain-English instructions into interactive web apps.",
    ],
    participant: "Choose one real task you would like AI to help you finish this week.",
  },
  {
    id: "cowork",
    number: "02",
    minutes: 10,
    title: "What Cowork actually is",
    aim: "Show the difference between receiving an answer and handing off a job.",
    talkingPoints: [
      "Tour Cowork, working folders, permissions, and files.",
      "Show a finished-work example, such as receipts turned into a spreadsheet.",
      "Point out that Cowork works best when the inputs and finish line are clear.",
    ],
    participant: "Open Claude Desktop, choose Cowork, and create a safe practice folder.",
  },
  {
    id: "brief",
    number: "03",
    minutes: 10,
    title: "Build your first Coworker",
    aim: "Create a useful daily brief and show how a one-time task becomes recurring work.",
    talkingPoints: [
      "Define the inputs, output, schedule, and what good looks like.",
      "Run it once before turning it into a scheduled task.",
      "Keep the first version small enough to verify in a minute.",
    ],
    participant: "Paste the prompt below into Cowork and answer its setup questions.",
    promptLabel: "Daily brief setup prompt",
    prompt: `Help me build a simple daily briefing workflow in this folder.

Start by asking me these four questions, one at a time:
1. What information should the briefing use?
2. Where can you find that information?
3. What sections should the finished briefing contain?
4. What time should it be ready?

After I answer, create a short sample briefing using any files already available in this folder. If something is missing, show me exactly what you need instead of inventing it.

Once I approve the sample, help me turn this into a recurring scheduled task. Keep the instructions simple and explain every permission before asking me to approve it.`,
  },
  {
    id: "lovable",
    number: "04",
    minutes: 10,
    title: "Lovable from zero",
    aim: "Make vibe coding feel concrete: words become a working web application.",
    talkingPoints: [
      "Create a Lovable account and tour the chat and preview panes.",
      "Frame the goal as a useful internal tool, not a technology startup.",
      "Show version history, device preview, and the publish flow.",
    ],
    participant: "Open Lovable and start a new blank project. Do not paste the build prompt yet.",
    link: "https://lovable.dev/",
    linkLabel: "Open Lovable",
  },
  {
    id: "strategy",
    number: "05",
    minutes: 10,
    title: "Build the Strategy Amplifier",
    aim: "Turn a plain-English strategy into a useful visual dashboard.",
    talkingPoints: [
      "Choose one strategy or plan you already understand.",
      "Let Lovable build the first working version before polishing it.",
      "Treat version one as something to react to, not something to perfect.",
    ],
    participant: "Replace the bracketed details, then paste the full prompt into Lovable.",
    promptLabel: "Strategy Amplifier build prompt",
    prompt: `Build me a clean, simple Strategy Amplifier web app for [MY BUSINESS, ROLE, OR PROJECT].

The app should help me turn this strategy into focused weekly action:
[PASTE OR DESCRIBE YOUR STRATEGY HERE]

Create these sections:
1. A one-screen strategy summary
2. My three most important priorities
3. A 90-day action plan broken into weeks
4. A simple progress dashboard with clear charts
5. Key risks, assumptions, and decisions I need to revisit
6. A weekly check-in where I can record wins, blockers, and next actions

Use plain language throughout. Make the first version easy to understand on both desktop and phone. Use realistic example content only where my information is missing, and label all example content clearly.

Do not add login, payments, a database, or complex integrations yet. Build the useful front-end experience first so I can review the structure and flow.`,
  },
  {
    id: "refine",
    number: "06",
    minutes: 10,
    title: "Customize, test, and publish",
    aim: "Show how to improve an app safely without starting over.",
    talkingPoints: [
      "Edit with plain-English prompts, Visual Edits, and screenshots.",
      "Check the phone preview and use version history as the safety net.",
      "Test the core journey before publishing and sharing.",
    ],
    participant: "Choose the single biggest improvement your app needs and use the prompt below.",
    promptLabel: "Focused refinement prompt",
    prompt: `Review the current app before changing anything.

The single improvement I want is:
[DESCRIBE THE CHANGE]

Keep every part that already works. Make only the changes needed for this improvement. Then check the result on desktop and mobile, confirm that every existing button still works, and summarize exactly what you changed.`,
  },
  {
    id: "choose",
    number: "07",
    minutes: 10,
    title: "Cowork or Lovable?",
    aim: "Give people a reusable rule for choosing the right tool.",
    talkingPoints: [
      "Use Cowork for private, recurring operational work with files.",
      "Use Lovable for interactive experiences that people can see and use.",
      "Some workflows use both: Cowork prepares the information, Lovable presents it.",
    ],
    participant: "Classify your next task: finished work, interactive experience, or both.",
  },
  {
    id: "plan",
    number: "08",
    minutes: 10,
    title: "Your starting plan and Q&A",
    aim: "End with one small commitment instead of a long list of possibilities.",
    talkingPoints: [
      "Choose one recurring task for Cowork.",
      "Choose one useful dashboard or tool for Lovable.",
      "Commit to finishing one small build before the next session.",
    ],
    participant: "Write down your Cowork task, your Lovable idea, and the first 20-minute action.",
    promptLabel: "My next-step plan",
    prompt: `Help me leave this session with a realistic starting plan.

My recurring Cowork task:
[ADD IT HERE]

My Lovable app or dashboard idea:
[ADD IT HERE]

Ask me only the questions needed to make both ideas specific. Then give me:
1. The smallest useful first version of each
2. The first 20-minute action for each
3. A simple definition of done
4. The biggest mistake to avoid

Keep the plan practical. I want to complete something useful, not design the perfect system.`,
  },
];

function CopyPrompt({ label, prompt }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fundamentals-prompt">
      <div className="fundamentals-prompt-head">
        <span>{label}</span>
        <button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy prompt"}</button>
      </div>
      <pre>{prompt}</pre>
    </div>
  );
}

export default function FundamentalsJulyPage() {
  return (
    <div className="fundamentals-page">
      <section className="fundamentals-hero">
        <div>
          <p className="section-kicker">July fundamentals session · 80 minutes</p>
          <h1>From your first AI coworker to your first useful app.</h1>
          <p className="fundamentals-lead">
            Start with Claude Cowork, build a practical workflow, then turn a real strategy into
            a working Lovable app. Follow the steps in order and copy the prompts when Igor calls for them.
          </p>
        </div>
        <aside className="fundamentals-outcome">
          <span>By the end</span>
          <strong>You will know which tool to use and have a first working version in both.</strong>
        </aside>
      </section>

      <nav className="fundamentals-jump" aria-label="Session steps">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            <span>{section.number}</span>
            {section.title}
          </a>
        ))}
      </nav>

      <section className="fundamentals-setup">
        <div>
          <p className="section-kicker">Before we start</p>
          <h2>Have these two tabs ready.</h2>
        </div>
        <div className="fundamentals-tool-links">
          <a href="https://claude.com/download" target="_blank" rel="noreferrer">
            <strong>Claude Desktop</strong>
            <span>Open Cowork and make a practice folder ↗</span>
          </a>
          <a href="https://lovable.dev/" target="_blank" rel="noreferrer">
            <strong>Lovable</strong>
            <span>Sign in and open a blank project ↗</span>
          </a>
        </div>
      </section>

      <div className="fundamentals-sections">
        {SECTIONS.map((section) => (
          <section className="fundamentals-step" id={section.id} key={section.id}>
            <header>
              <span className="fundamentals-number">{section.number}</span>
              <div>
                <p>{section.minutes} minutes</p>
                <h2>{section.title}</h2>
              </div>
            </header>
            <div className="fundamentals-step-grid">
              <div>
                <h3>What we're doing</h3>
                <p>{section.aim}</p>
                <ul>
                  {section.talkingPoints.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
              <aside>
                <span>Your move</span>
                <p>{section.participant}</p>
                {section.link && (
                  <a href={section.link} target="_blank" rel="noreferrer">{section.linkLabel} ↗</a>
                )}
              </aside>
            </div>
            {section.prompt && <CopyPrompt label={section.promptLabel} prompt={section.prompt} />}
          </section>
        ))}
      </div>

      <section className="fundamentals-close">
        <p className="section-kicker">One useful build beats ten saved ideas</p>
        <h2>Pick one lane and finish the smallest version.</h2>
        <p>
          Cowork handles the work. Lovable creates the experience. Now you have enough to start with either one.
        </p>
        <a href="#map">Back to the beginning ↑</a>
      </section>
    </div>
  );
}
