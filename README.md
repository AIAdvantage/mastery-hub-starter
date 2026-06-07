# My AI Hub — Starter

Your personal command center. It reads the markdown files your **Claude Cowork**
scheduled tasks commit to your **GitHub vault**, and shows them as a clean dashboard.

## 3-step setup (no terminal)

1. **Remix this in Lovable** (or clone the repo).
2. Open **`src/config.js`** and change two things:
   - `ownerName` → your name
   - `githubRepo` → `"your-username/your-vault-repo"`
3. **Publish.** Your Hub is live. Done.

That's it. Every time a Cowork task commits a new `.md` file to your vault,
it shows up here automatically.

## How a vault file looks
Your tasks save files like this — the frontmatter controls the card:
```markdown
---
title: Daily AI News Brief
emoji: 📰
rung: R4
updated: 2026-06-07
schedule: daily 7am
---
# Today's AI News
...your task's output...
```

## The ladder
Cards are tagged by rung so you can see your system climb:
**R1** Prompt · **R2** Saved Prompt · **R3** App · **R4** Pipeline · **R5** Self-improving

## Later (optional)
Supabase is pre-wired but off by default. When a future month needs a real
database, paste your Supabase URL + key into `src/config.js` and it switches on.
No code changes needed.
