# AI Mastery Hub

Member platform shell for AI Mastery. This replaces the Notion resource hub pattern with a Vercel-hosted React app at `https://mastery.aiadvantage.com`.

## Project map

- Live site: `https://mastery.aiadvantage.com`
- Vercel project: `mastery-hub-starter`
- GitHub repo: `AIAdvantage/mastery-hub-starter`
- Local source: `curriculum-development/mastery-hub-starter/`
- Demo vault repo: `AIAdvantage/mastery-hub-demo`

The app repo is `AIAdvantage/mastery-hub-starter`. Give collaborators access there if they need to edit the live Mastery Hub. The demo vault repo is separate sample data only.

## Domain setup

`mastery.aiadvantage.com` is attached to the Vercel project and verified.

DNS record:

```text
Type: CNAME
Name / Host: mastery
Value / Target: cname.vercel-dns.com
TTL: Auto
Proxy: DNS only / grey cloud if using Cloudflare
```

## What is included

- Premium AI Mastery visual direction using a dark, gold, serif-led interface.
- Routed top navigation for Home, Monthly Hubs, Challenge Archive, Submit, and Tutorial.
- July through December monthly hub shells, with July set as the current member month.
- July prerequisite page for the first member release: GitHub, Lovable, Mastery Hub, Claude Desktop, and active Claude Pro/Max/Team access.
- June content is kept in source as the old Month 6 template, but hidden from the live month picker and redirected away from member-facing routes.
- Plan 2 V1 direction: Launch Base plus the working Challenge OS foundation.
- Challenge archive foundation that shows recent submission rows.
- Challenge submission form with local preview storage and Supabase handoff.
- Tutorial page structure for member onboarding.
- Clerk-ready sign-in/status area for the next authentication pass.
- Plan 3 roadmap in `PLAN_3_ROADMAP.md`.

## GitHub vault data

The starter can read markdown outputs from a public GitHub vault. Configure the vault in `src/config.js`:

```js
export const CONFIG = {
  ownerName: "Igor",
  githubRepo: "AIAdvantage/mastery-hub-demo",
  vaultFolder: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
};
```

Cowork scheduled tasks can commit `.md` files to that vault. The hub reads them through the GitHub contents API and renders them as member-facing cards.

## Challenge submissions

The form works immediately in preview by saving recent submissions to local storage. To send submissions to Supabase, add the project URL and anon key in `src/config.js`, then create this table:

```sql
create table mastery_challenge_submissions (
  id uuid primary key,
  month text not null,
  member_name text not null,
  title text not null,
  share_link text not null,
  notes text,
  status text not null default 'Submitted for review',
  created_at timestamptz not null default now()
);
```

## Local commands

```bash
npm install
npm run dev
npm run build
```

## Routes

- `/`
- `/monthly-hubs`
- `/challenge-archive`
- `/submit`
- `/tutorial`

## Next integrations

- Replace the Clerk-ready placeholder with real Clerk components and membership claims.
- Add Clerk membership claims and protected routes.
- Feed monthly hub content from markdown or database records.
- Add archive filters once real submissions exist.
- Build the Plan 3 Mastery Campus roadmap.
