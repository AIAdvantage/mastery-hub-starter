import React, { useState } from "react";

const SETUP = [
  {
    href: "https://claude.com/download",
    title: "Claude Desktop",
    note: "Open Cowork and make a practice folder ↗",
  },
  {
    href: "https://lovable.dev/",
    title: "Lovable",
    note: "Sign in and open a blank project ↗",
  },
];

const CARDS = [
  {
    id: "chat",
    number: "01",
    tag: "See the difference",
    title: "Try it in Claude Chat",
    aim: "Ask Claude to plan your week. You will get good advice you still have to act on.",
    notice: null,
    promptLabel: "Claude Chat prompt",
    prompt: `Here's my week:
[LIST 3-4 THINGS: meetings, tasks, people to follow up with, deadlines]

Turn this into a clear priority list for the next 7 days.`,
  },
  {
    id: "cowork",
    number: "02",
    tag: "See the difference",
    title: "Try the same job in Cowork",
    aim: "Give Cowork the exact same week, but from a folder. Instead of advice, you get a finished file.",
    notice:
      "Same request as Card 1, but Cowork works from your folder and creates the finished plan for you. That is the difference between getting advice and getting the job done.",
    promptLabel: "Cowork prompt",
    prompt: `The notes in this folder describe my week:
[PUT A FILE IN THE FOLDER WITH 3-4 THINGS: meetings, tasks, people to follow up with, deadlines]

Turn this into a clear priority list for the next 7 days. Save it as PRIORITIES.md.`,
  },
  {
    id: "cowork-build",
    number: "03",
    tag: "Build one thing in Cowork",
    title: "Clean up a messy folder",
    aim: "Point Cowork at a folder that has become a mess and let it sort, summarize, and tell you what to do next.",
    notice: null,
    promptLabel: "Cowork clean-up prompt",
    prompt: `This folder is a mess. Clean it up for me.

Look through everything, then create:
1. FOLDER-OVERVIEW.md — what's in here, grouped into clear categories
2. NEXT-ACTIONS.md — my next 5 actions, ranked by urgency

Don't move, rename, or delete my files yet. Show me the plan first.`,
  },
  {
    id: "lovable-build",
    number: "04",
    tag: "Build one thing in Lovable",
    title: "Build a Strategy Tracker",
    aim: "Turn a plain-English goal into a working tracker you can actually check in with each week.",
    notice: null,
    promptLabel: "Lovable Strategy Tracker prompt",
    prompt: `Build a simple Strategy Tracker web app for [MY BUSINESS, ROLE, OR PROJECT].

My goal is:
[DESCRIBE IT HERE]

Include:
1. A one-screen summary of the goal
2. My top 3 priorities
3. A 90-day plan broken into weeks
4. A weekly check-in for wins, blockers, and next actions
5. A simple progress bar

Plain language, works on phone and desktop. No login or database. Build the smallest useful version first.`,
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
          <p className="section-kicker">July fundamentals session</p>
          <h1>Do four things. See what AI can really do.</h1>
          <p className="fundamentals-lead">
            Two prompts show the difference between Claude Chat and Cowork. Then you build one useful
            thing in each tool. Copy a prompt, follow along, and finish with something real.
          </p>
        </div>
        <aside className="fundamentals-outcome">
          <span>By the end</span>
          <strong>A cleaned-up folder in Cowork and a working tracker in Lovable.</strong>
        </aside>
      </section>

      <section className="fundamentals-setup">
        <div>
          <p className="section-kicker">Before we start</p>
          <h2>Have these two tabs ready.</h2>
        </div>
        <div className="fundamentals-tool-links">
          {SETUP.map((tool) => (
            <a key={tool.href} href={tool.href} target="_blank" rel="noreferrer">
              <strong>{tool.title}</strong>
              <span>{tool.note}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="fundamentals-sections">
        {CARDS.map((card) => (
          <section className="fundamentals-step" id={card.id} key={card.id}>
            <header>
              <span className="fundamentals-number">{card.number}</span>
              <div>
                <p>{card.tag}</p>
                <h2>{card.title}</h2>
              </div>
            </header>
            <p className="fundamentals-aim">{card.aim}</p>
            {card.notice && (
              <aside className="fundamentals-notice">
                <span>What you should notice</span>
                <p>{card.notice}</p>
              </aside>
            )}
            <CopyPrompt label={card.promptLabel} prompt={card.prompt} />
          </section>
        ))}
      </div>

      <section className="fundamentals-close">
        <p className="section-kicker">One useful build beats ten saved ideas</p>
        <h2>Pick one and finish the smallest version.</h2>
        <p>
          Cowork gets the work done. Lovable creates something you can see and use. You now have enough
          to start with either one.
        </p>
      </section>
    </div>
  );
}
