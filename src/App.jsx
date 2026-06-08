import React, { useEffect, useMemo, useState } from "react";
import { CONFIG } from "./config.js";
import { loadVault, loadDna, mdToHtml } from "./lib/vault.js";

const RUNGS = [
  { id: "R1", label: "Prompt" },
  { id: "R2", label: "Saved" },
  { id: "R3", label: "App" },
  { id: "R4", label: "Pipeline" },
  { id: "R5", label: "Self-improving" },
];

const PATHS = [
  {
    id: "business",
    label: "For My Business",
    short: "Business",
    signal: "Translate the build into an industry playbook.",
  },
  {
    id: "personal",
    label: "For My Life",
    short: "Personal",
    signal: "Use the system for family, learning, legacy, or a personal project.",
  },
  {
    id: "steady",
    label: "Step by Step",
    short: "Steady",
    signal: "Finish the smallest useful version before adding complexity.",
  },
  {
    id: "advanced",
    label: "Advanced Builder",
    short: "Advanced",
    signal: "Package the pattern into a reusable system or client-facing asset.",
  },
  {
    id: "stuck",
    label: "I Am Stuck",
    short: "Stuck",
    signal: "Turn the broken step into a clean support request and next action.",
  },
];

const CURRENT_BUILD = {
  title: "AI Meeting Command Center",
  promise: "Turn one real meeting transcript into intelligence, a proposal, and follow-up.",
  month: "Month 5",
  rung: "R4",
  progress: 62,
  nextAction: "Bring 2-3 real meeting transcripts or use the backup transcript.",
  outputs: ["Meeting intelligence report", "Personalized proposal", "Follow-up sequence"],
};

const TRACKS = [
  {
    type: "Minimum Win",
    time: "30-45 min",
    title: "One transcript to one useful report",
    copy: "Paste a transcript and extract buying signals, objections, action items, and direct quotes.",
  },
  {
    type: "Full Build",
    time: "2-3 hrs",
    title: "Command center with reusable prompts",
    copy: "Set up the project, add context, generate report, proposal, and follow-up from the same source.",
  },
  {
    type: "Power-Up",
    time: "Optional",
    title: "Dispatcher for different meeting types",
    copy: "Route sales, coaching, vendor, and internal meetings through different prompt chains.",
  },
];

const CORE_RESOURCES = [
  {
    title: "Month 5 Sales Build",
    emoji: "🎯",
    outcome: "sales",
    path: ["business", "stuck", "advanced"],
    rung: "R4",
    format: "Workshop",
    month: "Month 5",
    summary: "Meeting transcript to intelligence report, proposal, and follow-up.",
    action: "Open the build page",
  },
  {
    title: "Personal Advisory Board",
    emoji: "🧠",
    outcome: "strategy",
    path: ["personal", "steady", "advanced"],
    rung: "R3",
    format: "System",
    month: "Month 1",
    summary: "DNA extraction into five advisors who challenge and guide decisions.",
    action: "Adapt advisors",
  },
  {
    title: "Time Buyback Sheet",
    emoji: "⏱️",
    outcome: "time",
    path: ["business", "steady", "personal"],
    rung: "R3",
    format: "Template",
    month: "Month 3",
    summary: "Map recurring tasks, identify the biggest time killer, and automate the first draft.",
    action: "Find my bottleneck",
  },
  {
    title: "Marketing Skill Builder",
    emoji: "📣",
    outcome: "marketing",
    path: ["business", "advanced", "steady"],
    rung: "R4",
    format: "Skill",
    month: "Month 4",
    summary: "Create a reusable Claude skill that turns source ideas into platform-ready assets.",
    action: "Make a skill",
  },
  {
    title: "ChatGPT to Claude Bridge",
    emoji: "🌉",
    outcome: "setup",
    path: ["steady", "personal", "business"],
    rung: "R2",
    format: "Guide",
    month: "Resource",
    summary: "Move useful prior work into Claude projects without overwhelming the member.",
    action: "Migrate safely",
  },
  {
    title: "Builders Call Room",
    emoji: "🛠️",
    outcome: "advanced",
    path: ["advanced"],
    rung: "R5",
    format: "Peer Track",
    month: "Ongoing",
    summary: "A smaller room for packaged skills, multi-tool chains, and production workflows.",
    action: "Join advanced lane",
  },
];

const SHOWCASE = [
  {
    label: "Real estate adaptation",
    title: "Listing call to seller follow-up",
    path: "business",
  },
  {
    label: "Personal-use adaptation",
    title: "Family interview to legacy chapter",
    path: "personal",
  },
  {
    label: "Corporate adaptation",
    title: "Sales meeting to VP-ready recap",
    path: "stuck",
  },
  {
    label: "Advanced build",
    title: "Reusable proposal skill for client work",
    path: "advanced",
  },
];

const OUTCOMES = ["all", "sales", "time", "marketing", "strategy", "setup", "advanced"];

function normalizeVaultCard(card) {
  const category = (card.fm.category || "tools").toLowerCase();
  const title = card.fm.title || card.file;
  return {
    title,
    emoji: card.fm.emoji || "📄",
    outcome: category === "pipeline" ? "strategy" : category === "library" ? "setup" : "time",
    path: ["business", "steady"],
    rung: (card.fm.rung || "R2").toUpperCase(),
    format: category === "library" ? "Library" : "Tool",
    month: card.fm.schedule || "Vault",
    summary: card.body.split("\n").find((line) => line && !line.startsWith("#")) || "Vault resource from the current hub.",
    action: "Open resource",
    source: card,
  };
}

function pathName(pathId) {
  return PATHS.find((path) => path.id === pathId)?.short || pathId;
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [dna, setDna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPath, setSelectedPath] = useState("business");
  const [outcome, setOutcome] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [makeMineOpen, setMakeMineOpen] = useState(false);
  const [stuckOpen, setStuckOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("hub-theme") === "dark");

  useEffect(() => {
    loadVault(CONFIG.githubRepo, CONFIG.vaultFolder)
      .then(setCards)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    loadDna(CONFIG.githubRepo).then(setDna).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("hub-theme", dark ? "dark" : "light");
  }, [dark]);

  const resources = useMemo(() => {
    const vaultResources = cards.map(normalizeVaultCard);
    return [...CORE_RESOURCES, ...vaultResources];
  }, [cards]);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesPath = resource.path.includes(selectedPath);
      const matchesOutcome = outcome === "all" || resource.outcome === outcome;
      const matchesQuery =
        !q ||
        [resource.title, resource.summary, resource.format, resource.month]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesPath && matchesOutcome && matchesQuery;
    });
  }, [outcome, query, resources, selectedPath]);

  const activePath = PATHS.find((path) => path.id === selectedPath);
  const pathResources = resources.filter((resource) => resource.path.includes(selectedPath)).length;

  return (
    <div className="app">
      <nav className="nav">
        <div className="brand">
          <span className="logo">◆</span>
          <span>Mastery Hub</span>
        </div>
        <div className="navtabs">
          <a href="#month">This Month</a>
          <a href="#paths">Paths</a>
          <a href="#library">Library</a>
          <a href="#support">Support</a>
        </div>
        <button className="themebtn" onClick={() => setDark((d) => !d)} title="Toggle dark mode">
          {dark ? "☀️" : "🌙"}
        </button>
        <a className="repo" href={`https://github.com/${CONFIG.githubRepo}`} target="_blank" rel="noreferrer">
          vault ↗
        </a>
      </nav>

      <main className="wrap">
        <section className="hero" id="month">
          <div>
            <div className="eyebrow">AI Mastery member operating system</div>
            <h1>Build the system, then make it yours.</h1>
            <p className="sub">
              Your current month, next action, adaptations, support intake, and reusable resources in one place.
            </p>
            <div className="heroactions">
              <button className="primary" onClick={() => setMakeMineOpen(true)}>Make It Mine</button>
              <button className="secondary" onClick={() => setStuckOpen(true)}>I Am Stuck</button>
            </div>
          </div>
          <aside className="current">
            <div className="currenttop">
              <span>{CURRENT_BUILD.month}</span>
              <span className={`rung ${CURRENT_BUILD.rung}`}>{CURRENT_BUILD.rung}</span>
            </div>
            <h2>{CURRENT_BUILD.title}</h2>
            <p>{CURRENT_BUILD.promise}</p>
            <div className="progressbar" aria-label={`${CURRENT_BUILD.progress}% complete`}>
              <span style={{ width: `${CURRENT_BUILD.progress}%` }} />
            </div>
            <div className="next">
              <strong>Next action</strong>
              <span>{CURRENT_BUILD.nextAction}</span>
            </div>
          </aside>
        </section>

        <section className="section tracks">
          <div className="sechead">
            <h2>Choose The Right Depth</h2>
            <span className="secblurb">Same build, three ways to finish.</span>
          </div>
          <div className="trackgrid">
            {TRACKS.map((track) => (
              <article className="track" key={track.type}>
                <div className="trackmeta">
                  <span>{track.type}</span>
                  <span>{track.time}</span>
                </div>
                <h3>{track.title}</h3>
                <p>{track.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="paths">
          <div className="sechead">
            <h2>Pick Your Path</h2>
            <span className="secblurb">The hub adapts the same workshop to the member's reality.</span>
          </div>
          <div className="pathgrid">
            {PATHS.map((path) => (
              <button
                className={`path ${selectedPath === path.id ? "on" : ""}`}
                key={path.id}
                onClick={() => setSelectedPath(path.id)}
              >
                <span>{path.label}</span>
                <small>{path.signal}</small>
              </button>
            ))}
          </div>
          <div className="pathnote">
            <strong>{activePath.label}</strong>
            <span>{activePath.signal}</span>
            <span>{pathResources} matching resources</span>
          </div>
        </section>

        <section className="section library" id="library">
          <div className="sechead">
            <h2>Resource Library</h2>
            <span className="secblurb">Search by outcome, not by where the file lives.</span>
          </div>
          <div className="filters">
            <label>
              <span>Outcome</span>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                {OUTCOMES.map((item) => (
                  <option key={item} value={item}>{item === "all" ? "All outcomes" : item}</option>
                ))}
              </select>
            </label>
            <label className="search">
              <span>Find</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="proposal, email, DNA, stuck..."
              />
            </label>
          </div>
          {loading && <div className="empty">Loading current vault resources...</div>}
          {error && <div className="empty err">{error}</div>}
          {!loading && (
            <div className="resourcegrid">
              {filteredResources.map((resource, index) => (
                <button className="resource" key={`${resource.title}-${index}`} onClick={() => setOpen(resource)}>
                  <div className="resourcetop">
                    <span className="resourceicon">{resource.emoji}</span>
                    <span className={`rung ${resource.rung}`}>{resource.rung}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.summary}</p>
                  <div className="tags">
                    <span>{resource.month}</span>
                    <span>{resource.format}</span>
                    <span>{pathName(selectedPath)}</span>
                  </div>
                </button>
              ))}
              {filteredResources.length === 0 && (
                <div className="empty">No resource matches this path yet. That gap is useful signal for the curriculum team.</div>
              )}
            </div>
          )}
        </section>

        <section className="section split" id="support">
          <div className="supportbox">
            <div className="sechead tight">
              <h2>Stuck Desk</h2>
              <span className="secblurb">Turn broken builds into clean troubleshooting.</span>
            </div>
            <p>
              Submit what worked, where it broke, and what success looks like. The hub returns a self-debug prompt and a clean office-hours ticket.
            </p>
            <button className="secondary" onClick={() => setStuckOpen(true)}>Open Stuck Desk</button>
          </div>
          <div className="supportbox">
            <div className="sechead tight">
              <h2>Member Examples</h2>
              <span className="secblurb">Challenge work becomes permanent proof.</span>
            </div>
            <div className="showcase">
              {SHOWCASE.map((item) => (
                <button key={item.title} onClick={() => setSelectedPath(item.path)}>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section dna">
          <div className="sechead tight">
            <h2>DNA Files</h2>
            <span className="secblurb">{dna.length ? `${dna.length} live vault files` : "No DNA folder found yet"}</span>
          </div>
          <div className="dnagrid">
            {dna.map((file) => (
              <a key={file.name} href={file.downloadUrl} download={file.name}>
                <span>🧬</span>
                <strong>{file.title}</strong>
                <small>Download</small>
              </a>
            ))}
          </div>
        </section>
      </main>

      {open && <ResourceModal resource={open} onClose={() => setOpen(null)} />}
      {makeMineOpen && <MakeMineModal selectedPath={selectedPath} onClose={() => setMakeMineOpen(false)} />}
      {stuckOpen && <StuckModal onClose={() => setStuckOpen(false)} />}

      <footer>Comparison fork · Mastery Avatar DNA v2.0 · powered by Claude Cowork + GitHub</footer>
    </div>
  );
}

function ResourceModal({ resource, onClose }) {
  const html = resource.source ? mdToHtml(resource.source.body) : null;
  return (
    <div className="modal" onClick={(e) => e.target.className === "modal" && onClose()}>
      <div className="panel">
        <button className="x" onClick={onClose}>×</button>
        <div className="phead">
          <div className="icon big">{resource.emoji}</div>
          <div>
            <h2>{resource.title}</h2>
            <div className="pmeta">
              <span className={`rung ${resource.rung}`}>{resource.rung}</span>
              <span>{resource.format}</span>
              <span>{resource.month}</span>
            </div>
          </div>
        </div>
        {html ? (
          <div className="pbody" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="pbody">
            <p>{resource.summary}</p>
            <h3>Recommended action</h3>
            <p>{resource.action}</p>
            <h3>Adaptation prompts</h3>
            <ul>
              <li>What version of this would produce a visible win this week?</li>
              <li>What context does the AI need before it can make useful decisions?</li>
              <li>What is the simplest path, and what is the optional power-up?</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MakeMineModal({ selectedPath, onClose }) {
  const path = PATHS.find((item) => item.id === selectedPath);
  return (
    <div className="modal" onClick={(e) => e.target.className === "modal" && onClose()}>
      <div className="panel">
        <button className="x" onClick={onClose}>×</button>
        <div className="phead">
          <div className="icon big">🧭</div>
          <div>
            <h2>Make It Mine</h2>
            <div className="pmeta"><span>{path.label}</span></div>
          </div>
        </div>
        <div className="formgrid">
          <label>
            <span>What are you trying to use this for?</span>
            <textarea defaultValue="I want to turn this month's build into..." />
          </label>
          <label>
            <span>What context or files do you already have?</span>
            <textarea defaultValue="I have transcripts, notes, client DNA, examples..." />
          </label>
          <label>
            <span>What should the finished system produce?</span>
            <textarea defaultValue="A report, proposal, checklist, weekly digest..." />
          </label>
        </div>
        <div className="generated">
          <strong>Preview output</strong>
          <p>Customized implementation plan, adapted prompts, minimum win, and optional power-up for this path.</p>
        </div>
      </div>
    </div>
  );
}

function StuckModal({ onClose }) {
  return (
    <div className="modal" onClick={(e) => e.target.className === "modal" && onClose()}>
      <div className="panel">
        <button className="x" onClick={onClose}>×</button>
        <div className="phead">
          <div className="icon big">🧯</div>
          <div>
            <h2>Stuck Desk</h2>
            <div className="pmeta"><span>Structured troubleshooting intake</span></div>
          </div>
        </div>
        <div className="formgrid">
          <label>
            <span>What are you building?</span>
            <input defaultValue="Meeting Command Center for..." />
          </label>
          <label>
            <span>What worked?</span>
            <textarea defaultValue="The project setup worked, but..." />
          </label>
          <label>
            <span>Where did it break?</span>
            <textarea defaultValue="Step 2 produced generic output / connector failed / prompt drifted..." />
          </label>
          <label>
            <span>What would success look like?</span>
            <textarea defaultValue="I want the output to be usable enough to..." />
          </label>
        </div>
        <div className="generated">
          <strong>Ticket generated for office hours</strong>
          <p>Includes a self-debug checklist, likely cause, next prompt to try, and facilitator-ready summary.</p>
        </div>
      </div>
    </div>
  );
}
