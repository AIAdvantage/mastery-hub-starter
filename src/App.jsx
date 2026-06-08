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

const MONTH_BUILDS = [
  {
    month: "Month 1",
    title: "Personal Advisory Board",
    emoji: "🧠",
    upstream: "Self-awareness and reflection",
    system: "DNA extraction to five AI advisors",
    output: "Custom advisory board that knows the member's context",
    rung: "R3",
    tool: "ChatGPT Custom GPTs",
    prework: "Bring personal DNA notes or use the guided intake fallback.",
    challenge: "Create your own advisory board and use it on one real decision.",
    paths: {
      business: "Turn the advisors into a CEO room for strategy, delegation, and tradeoff decisions.",
      personal: "Use advisors for legacy, family decisions, learning plans, and life direction.",
      steady: "Build one advisor first, test it on one question, then add the other four.",
      advanced: "Package the advisor prompt stack as a reusable skill or client-facing template.",
      stuck: "Submit the advisor that feels generic plus the context it failed to use.",
    },
  },
  {
    month: "Month 2",
    title: "Strategy Dashboard",
    emoji: "🗺️",
    upstream: "Strategic thinking",
    system: "Clone DNA to roadmap dashboard",
    output: "Long-term vision, low-hanging fruit, and quarterly roadmap",
    rung: "R3",
    tool: "ChatGPT + Lovable",
    prework: "Bring business or project DNA. Backup: use the sample owner-operator profile.",
    challenge: "Build a simple strategy dashboard for a real business, job, or project.",
    paths: {
      business: "Map offers, bottlenecks, next hires, and the next 90-day operating plan.",
      personal: "Map a second-chapter project, learning plan, or family archive roadmap.",
      steady: "Skip the app wrapper and complete only the roadmap artifact.",
      advanced: "Turn the roadmap into a living dashboard with review cadence and update prompts.",
      stuck: "Submit the part where the dashboard became too broad or too generic.",
    },
  },
  {
    month: "Month 3",
    title: "Time Buyback System",
    emoji: "⏱️",
    upstream: "Time awareness",
    system: "Task map to automation candidates",
    output: "AI-assisted sheet that finds and drafts the first automation target",
    rung: "R3",
    tool: "Google Sheets AI + ChatGPT",
    prework: "Bring a rough list of weekly tasks. Backup: use the sample week.",
    challenge: "Automate or delegate the highest-friction recurring task.",
    paths: {
      business: "Find the work only the owner still approves and build the first handoff.",
      personal: "Turn scattered routines into a weekly planning assistant.",
      steady: "Track only one day, choose one task, and write one reusable prompt.",
      advanced: "Create a weekly time audit pipeline with recurring review and improvement.",
      stuck: "Submit the task that resists automation and the exact reason it still needs you.",
    },
  },
  {
    month: "Month 4",
    title: "Marketing Skill Builder",
    emoji: "📣",
    upstream: "Creative multiplication",
    system: "Source idea to reusable Claude skill",
    output: "Platform-ready content generated from one source idea",
    rung: "R4",
    tool: "Claude Cowork",
    prework: "Bring one content idea, offer, or story. Backup: use the provided sample.",
    challenge: "Build and share your first reusable skill.",
    paths: {
      business: "Turn an offer, listing, case study, or client story into reusable marketing output.",
      personal: "Create a family newsletter, learning reflection, or personal project update system.",
      steady: "Make one format work before adding multiple platforms.",
      advanced: "Package the skill with examples, constraints, QA checks, and install instructions.",
      stuck: "Submit where the skill loses your voice or produces bland output.",
    },
  },
  {
    month: "Month 5",
    title: "AI Meeting Command Center",
    emoji: "🎯",
    upstream: "Active listening and empathy",
    system: "Transcript to intelligence, proposal, and follow-up",
    output: "Meeting intelligence report, proposal, and follow-up sequence",
    rung: "R4",
    tool: "Claude Cowork + Connectors",
    prework: "Bring 2-3 real transcripts. Backup: use the sample transcript.",
    challenge: "Run the system on three real meetings and bring the best output to demo.",
    paths: {
      business: "Use sales, client, tenant, or vendor conversations to improve follow-up and conversion.",
      personal: "Use family interviews, advisory calls, or planning conversations to capture decisions.",
      steady: "Generate only the intelligence report before attempting proposals or follow-up.",
      advanced: "Create a dispatcher for sales, coaching, internal, and vendor meetings.",
      stuck: "Submit the transcript, the weak output, and the exact output you expected.",
    },
  },
];

const CORE_RESOURCES = [
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
const MONTH_FILTERS = ["all", ...MONTH_BUILDS.map((build) => build.month), "Resource", "Ongoing", "Vault"];
const RUNG_FILTERS = ["all", ...RUNGS.map((rung) => rung.id)];
const FORMAT_FILTERS = ["all", "Workshop", "System", "Template", "Skill", "Guide", "Peer Track", "Tool", "Library"];

function buildToResource(build) {
  const outcomeMap = {
    "Month 1": "strategy",
    "Month 2": "strategy",
    "Month 3": "time",
    "Month 4": "marketing",
    "Month 5": "sales",
  };
  return {
    title: build.title,
    emoji: build.emoji,
    outcome: outcomeMap[build.month] || "strategy",
    path: Object.keys(build.paths),
    rung: build.rung,
    format: "Workshop",
    month: build.month,
    summary: `${build.system}. Output: ${build.output}.`,
    action: "Open monthly build page",
    build,
  };
}

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
  const [monthFilter, setMonthFilter] = useState("all");
  const [rungFilter, setRungFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [buildOpen, setBuildOpen] = useState(null);
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
    const monthlyResources = MONTH_BUILDS.map(buildToResource);
    return [...monthlyResources, ...CORE_RESOURCES, ...vaultResources];
  }, [cards]);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesPath = resource.path.includes(selectedPath);
      const matchesOutcome = outcome === "all" || resource.outcome === outcome;
      const matchesMonth = monthFilter === "all" || resource.month === monthFilter;
      const matchesRung = rungFilter === "all" || resource.rung === rungFilter;
      const matchesFormat = formatFilter === "all" || resource.format === formatFilter;
      const matchesQuery =
        !q ||
        [resource.title, resource.summary, resource.format, resource.month]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesPath && matchesOutcome && matchesMonth && matchesRung && matchesFormat && matchesQuery;
    });
  }, [formatFilter, monthFilter, outcome, query, resources, rungFilter, selectedPath]);

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
          <a href="#builds">Build Pages</a>
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
              <button className="secondary" onClick={() => setBuildOpen(MONTH_BUILDS[4])}>Open Build Page</button>
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

        <section className="section" id="builds">
          <div className="sechead">
            <h2>Monthly Build Pages</h2>
            <span className="secblurb">Canonical pages for Months 1-5 with pre-work, outputs, challenge, and path adaptations.</span>
          </div>
          <div className="buildgrid">
            {MONTH_BUILDS.map((build) => (
              <button className="buildcard" key={build.month} onClick={() => setBuildOpen(build)}>
                <div className="buildtop">
                  <span>{build.month}</span>
                  <span className={`rung ${build.rung}`}>{build.rung}</span>
                </div>
                <div className="buildtitle">
                  <span>{build.emoji}</span>
                  <strong>{build.title}</strong>
                </div>
                <p>{build.output}</p>
                <div className="buildmeta">
                  <span>{build.upstream}</span>
                  <span>{build.tool}</span>
                </div>
              </button>
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
            <label>
              <span>Month</span>
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                {MONTH_FILTERS.map((item) => (
                  <option key={item} value={item}>{item === "all" ? "All months" : item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Rung</span>
              <select value={rungFilter} onChange={(e) => setRungFilter(e.target.value)}>
                {RUNG_FILTERS.map((item) => (
                  <option key={item} value={item}>{item === "all" ? "All rungs" : item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Format</span>
              <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
                {FORMAT_FILTERS.map((item) => (
                  <option key={item} value={item}>{item === "all" ? "All formats" : item}</option>
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
                <button
                  className="resource"
                  key={`${resource.title}-${index}`}
                  onClick={() => (resource.build ? setBuildOpen(resource.build) : setOpen(resource))}
                >
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
      {buildOpen && <BuildModal build={buildOpen} selectedPath={selectedPath} onClose={() => setBuildOpen(null)} />}
      {makeMineOpen && <MakeMineModal selectedPath={selectedPath} onClose={() => setMakeMineOpen(false)} />}
      {stuckOpen && <StuckModal onClose={() => setStuckOpen(false)} />}

      <footer>Comparison fork · Mastery Avatar DNA v2.0 · powered by Claude Cowork + GitHub</footer>
    </div>
  );
}

function BuildModal({ build, selectedPath, onClose }) {
  return (
    <div className="modal" onClick={(e) => e.target.className === "modal" && onClose()}>
      <div className="panel buildpanel">
        <button className="x" onClick={onClose}>×</button>
        <div className="phead">
          <div className="icon big">{build.emoji}</div>
          <div>
            <h2>{build.title}</h2>
            <div className="pmeta">
              <span>{build.month}</span>
              <span className={`rung ${build.rung}`}>{build.rung}</span>
              <span>{build.tool}</span>
            </div>
          </div>
        </div>
        <div className="buildpage">
          <section>
            <h3>The Promise</h3>
            <p>{build.output}</p>
          </section>
          <div className="twocol">
            <section>
              <h3>Upstream Principle</h3>
              <p>{build.upstream}</p>
            </section>
            <section>
              <h3>Downstream System</h3>
              <p>{build.system}</p>
            </section>
          </div>
          <div className="twocol">
            <section>
              <h3>Pre-work</h3>
              <p>{build.prework}</p>
            </section>
            <section>
              <h3>Challenge</h3>
              <p>{build.challenge}</p>
            </section>
          </div>
          <section>
            <h3>Adapt This Build</h3>
            <div className="adaptgrid">
              {PATHS.map((path) => (
                <button className={path.id === selectedPath ? "on" : ""} key={path.id}>
                  <strong>{path.short}</strong>
                  <span>{build.paths[path.id]}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>Resource Page Checklist</h3>
            <ul>
              <li>Finished demo in the first five minutes.</li>
              <li>Pre-work plus fallback for members who did not prepare.</li>
              <li>Minimum Win, Full Build, and Power-Up clearly separated.</li>
              <li>Submission example for each member path.</li>
              <li>Troubleshooting prompts for common stuck points.</li>
            </ul>
          </section>
        </div>
      </div>
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
