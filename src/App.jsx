import React, { useEffect, useMemo, useState, useRef } from "react";
import { CONFIG } from "./config.js";
import { loadVault, loadDna, mdToHtml } from "./lib/vault.js";

const RUNGS = [
  { id: "R1", label: "Prompt" },
  { id: "R2", label: "Saved" },
  { id: "R3", label: "App" },
  { id: "R4", label: "Pipeline" },
  { id: "R5", label: "Self-improving" },
];

const CATEGORIES = [
  { id: "tools", label: "Tools", emoji: "⚙️", blurb: "Things your AI runs for you" },
  { id: "pipeline", label: "Ideas", emoji: "💡", blurb: "What you want to build & try next" },
  { id: "library", label: "Library", emoji: "📚", blurb: "Saved prompts, skills, DNA & references" },
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [dna, setDna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);     // detail modal (vault card)
  const [dnaOpen, setDnaOpen] = useState(false); // DNA download modal
  const [tab, setTab] = useState("all");
  const [menu, setMenu] = useState(null);     // which nav dropdown is open
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

  async function downloadDna(file) {
    try {
      const text = await (await fetch(file.downloadUrl)).text();
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
  }

  const itemsByCat = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.id] = []));
    cards.forEach((x) => {
      const cat = (x.fm.category || "tools").toLowerCase();
      (map[cat] || (map[cat] = [])).push(x);
    });
    return map;
  }, [cards]);

  const counts = useMemo(() => {
    const c = { all: cards.length + (dna.length ? 1 : 0) };
    CATEGORIES.forEach((cat) => {
      c[cat.id] = (itemsByCat[cat.id] || []).length;
    });
    if (dna.length) c.library += 1; // DNA card counts as a Library item
    return c;
  }, [cards, dna, itemsByCat]);

  const groups = useMemo(() => {
    const show = tab === "all" ? CATEGORIES.map((c) => c.id) : [tab];
    return show.map((catId) => ({
      cat: CATEGORIES.find((c) => c.id === catId),
      items: itemsByCat[catId] || [],
    }));
  }, [itemsByCat, tab]);

  const DNA_CARD = { isDna: true, fm: { title: "DNA Files", emoji: "🧬", rung: "R2" } };

  const Tile = ({ c, onClick }) => {
    const rung = (c.fm.rung || "").toUpperCase();
    return (
      <button className="tile" onClick={onClick}>
        <div className="icon">{c.fm.emoji || "📄"}</div>
        <div className="tiletitle">{c.fm.title || c.file}</div>
        <div className="tilemeta">
          {rung && <span className={`dot ${rung}`} title={`Rung ${rung[1]}`}></span>}
          {c.isDna ? <span className="sched">{dna.length} files</span> : c.fm.schedule && <span className="sched">{c.fm.schedule}</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="app">
      {/* NAV BAR */}
      <nav className="nav" onMouseLeave={() => setMenu(null)}>
        <div className="brand">
          <span className="logo">◆</span>
          <span>{CONFIG.ownerName ? `${CONFIG.ownerName}'s Hub` : "My Hub"}</span>
        </div>
        <div className="navtabs">
          <button className={tab === "all" ? "on" : ""} onClick={() => { setTab("all"); setMenu(null); }}>
            Home
          </button>
          {CATEGORIES.map((c) => {
            const items = c.id === "library" ? [...(itemsByCat.library || []), ...(dna.length ? [DNA_CARD] : [])] : itemsByCat[c.id] || [];
            return (
              <div key={c.id} className="navitem" onMouseEnter={() => setMenu(c.id)}>
                <button className={tab === c.id ? "on" : ""} onClick={() => { setTab(c.id); setMenu(null); }}>
                  {c.emoji} {c.label} <span className="ct">{counts[c.id] || 0}</span> <span className="caret">⌄</span>
                </button>
                {menu === c.id && items.length > 0 && (
                  <div className="dropdown">
                    {items.map((it, i) => (
                      <button key={i} className="dropitem" onClick={() => { it.isDna ? setDnaOpen(true) : setOpen(it); setMenu(null); }}>
                        <span>{it.fm.emoji || "📄"}</span>
                        <span>{it.fm.title || it.file}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="themebtn" onClick={() => setDark((d) => !d)} title="Toggle dark mode">
          {dark ? "☀️" : "🌙"}
        </button>
        <a className="repo" href={`https://github.com/${CONFIG.githubRepo}`} target="_blank" rel="noreferrer">vault ↗</a>
      </nav>

      <div className="wrap">
        <div className="hello">Welcome back 👋</div>
        <h1>{CONFIG.ownerName ? `${CONFIG.ownerName}'s AI Hub` : "My AI Hub"}</h1>
        <p className="sub">Everything my AI builds for me — in one place.</p>

        <div className="ladder">
          {RUNGS.map((r) => (
            <span key={r.id} className={`rung ${r.id}`} title={`Rung ${r.id[1]}: ${r.label}`}>{r.id} {r.label}</span>
          ))}
        </div>

        {loading && <div className="empty">Loading your tools…</div>}
        {error && (
          <div className="empty err">{error}
            <div className="hint">Edit <code>src/config.js</code> to point at your vault.</div>
          </div>
        )}
        {!loading && !error && cards.length === 0 && (
          <div className="empty">Your vault is empty. Add a markdown file to <code>{CONFIG.githubRepo}</code> and it'll appear here.</div>
        )}

        {!loading && !error &&
          groups.map(({ cat, items }) => {
            const isLibrary = cat.id === "library";
            const hasDna = isLibrary && dna.length > 0;
            if (items.length === 0 && !hasDna) return null;
            return (
              <section key={cat.id} className="section">
                <div className="sechead">
                  <h2><span className="secemoji">{cat.emoji}</span> {cat.label}</h2>
                  <span className="secblurb">{cat.blurb}</span>
                </div>
                <div className="grid">
                  {items.map((c, i) => <Tile key={i} c={c} onClick={() => setOpen(c)} />)}
                  {hasDna && <Tile c={DNA_CARD} onClick={() => setDnaOpen(true)} />}
                </div>
              </section>
            );
          })}
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

      {/* DNA DOWNLOAD MODAL */}
      {dnaOpen && (
        <div className="modal" onClick={(e) => e.target.className === "modal" && setDnaOpen(false)}>
          <div className="panel">
            <button className="x" onClick={() => setDnaOpen(false)}>×</button>
            <div className="phead">
              <div className="icon big">🧬</div>
              <div>
                <h2>DNA Files</h2>
                <div className="pmeta"><span className="sched">Your AI's context — download any file with one click</span></div>
              </div>
            </div>
            <div className="dnalist">
              {dna.map((f, i) => (
                <div className="dnarow" key={i}>
                  <span className="dnaicon">🧬</span>
                  <span className="dnatitle">{f.title}</span>
                  <button className="dnabtn" onClick={() => downloadDna(f)}>↓ Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer>Built with my AI Hub · powered by Claude Cowork + GitHub</footer>
    </div>
  );
}
