import React, { useEffect, useState } from "react";
import { CONFIG } from "./config.js";
import { loadVault, mdToHtml } from "./lib/vault.js";

const RUNGS = [
  { id: "R1", label: "Prompt" },
  { id: "R2", label: "Saved" },
  { id: "R3", label: "App" },
  { id: "R4", label: "Pipeline" },
  { id: "R5", label: "Self-improving" },
];

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadVault(CONFIG.githubRepo, CONFIG.vaultFolder)
      .then(setCards)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="wrap">
      <div className="hello">Welcome back 👋</div>
      <h1>{CONFIG.ownerName ? `${CONFIG.ownerName}'s AI Hub` : "My AI Hub"}</h1>
      <p className="sub">
        Everything my AI builds for me — in one place.{" "}
        <span className="tag">reads from {CONFIG.githubRepo}</span>
      </p>

      <div className="ladder">
        {RUNGS.map((r) => (
          <span key={r.id} className={`rung ${r.id}`}>
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
          Your vault is empty. Add a markdown file to{" "}
          <code>{CONFIG.githubRepo}</code> and it'll appear here.
        </div>
      )}

      <div className="grid">
        {cards.map((c, i) => {
          const rung = (c.fm.rung || "").toUpperCase();
          return (
            <button className="card" key={i} onClick={() => setOpen(c)}>
              <div className="top">
                <span className="emoji">{c.fm.emoji || "📄"}</span>
                <span className="title">{c.fm.title || c.file}</span>
                {rung && <span className={`badge ${rung}`}>{rung}</span>}
              </div>
              <div className="meta">
                {c.fm.schedule ? `⏰ ${c.fm.schedule} · ` : ""}
                updated {c.fm.updated || "—"}
              </div>
              <div
                className="body"
                dangerouslySetInnerHTML={{ __html: mdToHtml(c.body).slice(0, 360) }}
              />
            </button>
          );
        })}
      </div>

      {open && (
        <div className="modal" onClick={(e) => e.target.className === "modal" && setOpen(null)}>
          <div className="panel">
            <span className="x" onClick={() => setOpen(null)}>×</span>
            <h2>
              {open.fm.emoji || ""} {open.fm.title || open.file}
            </h2>
            <div dangerouslySetInnerHTML={{ __html: mdToHtml(open.body) }} />
          </div>
        </div>
      )}

      <footer>Built with my AI Hub · powered by Claude Cowork + GitHub</footer>
    </div>
  );
}
