// Reads your markdown vault from GitHub and parses each file's frontmatter.
// No auth needed for public repos.

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { fm, body: m[2] };
}

export async function loadVault(repo, folder = "") {
  const path = folder ? `/${folder.replace(/^\/|\/$/g, "")}` : "";
  const api = `https://api.github.com/repos/${repo}/contents${path}`;
  const res = await fetch(api);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "Vault not found — check your repo name in config.js (and that it's public)."
        : `GitHub error ${res.status}`
    );
  }
  const list = await res.json();
  const mdFiles = list.filter(
    (f) => f.name.endsWith(".md") && f.name.toLowerCase() !== "readme.md"
  );
  const cards = [];
  for (const f of mdFiles) {
    try {
      const text = await (await fetch(f.download_url)).text();
      const { fm, body } = parseFrontmatter(text);
      cards.push({ file: f.name, fm, body });
    } catch (_) {
      /* skip unreadable file */
    }
  }
  const rungOrder = { R5: 5, R4: 4, R3: 3, R2: 2, R1: 1 };
  cards.sort(
    (a, b) =>
      (rungOrder[(b.fm.rung || "").toUpperCase()] || 0) -
      (rungOrder[(a.fm.rung || "").toUpperCase()] || 0)
  );
  return cards;
}

// Lists DNA files from a /dna folder in the repo, for 1-click download.
export async function loadDna(repo, folder = "dna") {
  const api = `https://api.github.com/repos/${repo}/contents/${folder}`;
  const res = await fetch(api);
  if (!res.ok) return []; // no dna folder yet = fine
  const list = await res.json();
  return list
    .filter((f) => f.name.endsWith(".md"))
    .map((f) => ({
      name: f.name,
      title: f.name.replace(/\.md$/, "").replace(/-/g, " ").replace(/dna/i, "DNA"),
      downloadUrl: f.download_url,
    }));
}

// Tiny markdown -> HTML (enough for task outputs; no deps so it imports cleanly into Lovable)
export function mdToHtml(s) {
  return s
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>")
    .replace(/^\s*\d+\. (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "<br/><br/>");
}
