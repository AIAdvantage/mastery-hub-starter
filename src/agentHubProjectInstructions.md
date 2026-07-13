# AI Agent Hub. Project Instructions

## What this is

A personal dashboard made of cards. To the user, everything is a card: content that arrives, things they save, tools that do something. The user is non-technical. They will describe what they want in plain language. Never ask them to classify what kind of thing it is. Deciding how to build it is your job, done silently.

Content lives as Markdown files in a private GitHub vault repo (`CONFIG.githubRepo` in `src/config.js`, folder `CONFIG.vaultFolder`), read at runtime by the `get-cards` function. New content appears after a page reload. Claude also writes files into this vault from outside through scheduled tasks. The vault is the hub's memory. Protect it above everything else.

## Adding anything

Whenever the user wants to add something to the hub, whatever they call it, use the **AgentHub Builder** skill. It contains complete recipes and all code templates. Never improvise an architecture, and never depend on an existing app or view as a template. The user may have deleted or customized anything, and that is allowed.

## Hard rules

- Three generic backend functions power everything: `get-cards` (read), `submit-card` (write), `run-ai` (think). Compose these. Never duplicate them, specialize them, or add new functions without explicit user approval.
- `src/App.jsx` (`CATEGORIES` and `APP_SECTIONS`) is the single source of truth for the nav and homepage. Never hardcode tabs or tiles elsewhere.
- Anything the user wants to keep becomes a vault file via `submit-card`. Never a database table, migration, or localStorage store.
- Never modify `get-cards`, rename the vault folder, or change the frontmatter format (`title, emoji, category, updated`). Claude's scheduled tasks depend on these.
- Tokens and keys live only in Edge Function secrets, never in frontend code.
- The user may change or delete anything they name. Never touch anything they did not name. If a request is vague and destructive ("clean this up"), list what you would change and wait for approval.
- Deploy every Edge Function you create or change, and say so.

## Known errors

- GitHub 401/403/404 → the `GITHUB_VAULT_TOKEN` is expired or read-only. Say: "Your GitHub token likely expired. On GitHub: Settings, Developer settings, Fine-grained tokens. Generate a new token for your hub repo with Contents: Read and Write. Paste it in BOTH places: the GITHUB_VAULT_TOKEN secret in Lovable, and gh-token.txt in your agenthub folder." No code workarounds.
- An AI feature fails → the Lovable AI balance is likely empty. Say: "Check Settings, Cloud & AI balance in Lovable and top up if needed."

## How to talk to this user

- Plain words, short sentences, no jargon. It is all just cards on their hub.
- One change per message. End with the single next action, like "Reload the page to see your new card."
- Make the safe default choice and state your assumption in one line instead of asking questions.
- No code in explanations unless asked.
