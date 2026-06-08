import React, { useEffect, useMemo, useState } from "react";
import { CONFIG } from "./config.js";
import { loadVault, mdToHtml } from "./lib/vault.js";

const RUNGS = [
  { id: "R1", label: "Prompt" },
  { id: "R2", label: "Saved" },
  { id: "R3", label: "App" },
  { id: "R4", label: "Pipeline" },
  { id: "R5", label: "Self-improving" },
];

const CATEGORIES = [
  { id: "tools", label: "Tools", emoji: "⚙️", blurb: "Things your AI runs for you" },
  { id: "library", label: "Library", emoji: "📚", blurb: "Saved prompts, skills & references" },
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    loadVault(CONFIG.githubRepo, CONFIG.vaultFolder)
      .then(setCards)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: cards.length };
    CATEGORIES.forEach((cat) => {
      c[cat.id] = cards.filter((x) => (x.fm.category || "tools").toLowerCase() === cat.id).length;
    });
    return c;
  }, [cards]);

  const groups = useMemo(() => {
    const show = tab === "all" ? CATEGORIES.map((c) => c.id) : [tab];
    return show.map((catId) => ({
      cat: CATEGORIES.find((c) => c.id === catId),
      items: cards.filter((x) => (x.fm.category || "tools").toLowerCase() === catId),
    }));
  }, [cards, tab]);

  return (
    <div className="app">
      {/* NAV BAR */}
      <nav className="nav">
        <div className="brand">
          <span className="logo">◆</span>
          <span>{CONFIG.ownerName ? `${CONFIG.ownerName}'s Hub` : "My Hub"}</span>
        </div>
        <div className="navtabs">
          <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
            Home <span className="ct">{counts.all || 0}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={tab === c.id ? "on" : ""} onClick={() => setTab(c.id)}>
              {c.emoji} {c.label} <span className="ct">{counts[c.id] || 0}</span>
            </button>
          ))}
        </div>
        <a className="repo" href={`https://github.com/${CONFIG.githubRepo}`} target="_blank" rel="noreferrer">
          vault ↗
        </a>
      </nav>

      <div className="wrap">
        <div className="hello">Welcome back 👋</div>
        <h1>{CONFIG.ownerName ? `${CONFIG.ownerName}'s AI Hub` : "My AI Hub"}</h1>
        <p className="sub">Everything my AI builds for me — in one place.</p>

        <div className="ladder">
          {RUNGS.map((r) => (
            <span key={r.id} className={`rung ${r.id}`} title={`Rung ${r.id[1]}: ${r.label}`}>
              {r.id} {r.label}
            </span>
          ))}
        </div>

        {loading && <div className="empty">Loading your tools…</div>}
        {error && (
          <div className="empty err">
            {error}
            <div className="hint">Edit <code>src/config.js</code> to point at your vault.</div>
          </div>
        )}
        {!loading && !error && cards.length === 0 && (
          <div className="empty">
            Your vault is empty. Add a markdown file to <code>{CONFIG.githubRepo}</code> and it'll appear here.
          </div>
        )}

        {!loading && !error &&
          groups.map(
            ({ cat, items }) =>
              items.length > 0 && (
                <section key={cat.id} className="section">
                  <div className="sechead">
                    <h2>
                      <span className="secemoji">{cat.emoji}</span> {cat.label}
                    </h2>
                    <span className="secblurb">{cat.blurb}</span>
                  </div>
                  <div className="grid">
                    {items.map((c, i) => {
                      const rung = (c.fm.rung || "").toUpperCase();
                      return (
                        <button className="tile" key={i} onClick={() => setOpen(c)}>
                          <div className="icon">{c.fm.emoji || "📄"}</div>
                          <div className="tiletitle">{c.fm.title || c.file}</div>
                          <div className="tilemeta">
                            {rung && <span className={`dot ${rung}`} title={`Rung ${rung[1]}`}></span>}
                            {c.fm.schedule && <span className="sched">{c.fm.schedule}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )
          )}
      </div>

      {/* DETAIL MODAL */}
      {open && (
        <div className="modal" onClick={(e) => e.target.className === "modal" && setOpen(null)}>
          <div className="panel">
            <button className="x" onClick={() => setOpen(null)}>×</button>
            <div className="phead">
              <div className="icon big">{open.fm.emoji || "📄"}</div>
              <div>
                <h2>{open.fm.title || open.file}</h2>
                <div className="pmeta">
                  {open.fm.rung && <><span className={`dot ${(open.fm.rung || "").toUpperCase()}`}></span><span className="sched">{open.fm.rung}</span></>}
                  {open.fm.schedule && <span className="sched">· {open.fm.schedule}</span>}
                  {open.fm.updated && <span className="sched">· updated {open.fm.updated}</span>}
                </div>
              </div>
            </div>
            <div className="pbody" dangerouslySetInnerHTML={{ __html: mdToHtml(open.body) }} />
          </div>
        </div>
      )}

      <footer>Built with my AI Hub · powered by Claude Cowork + GitHub</footer>
    </div>
  );
}
