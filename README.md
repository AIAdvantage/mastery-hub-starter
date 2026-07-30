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
- Routed top navigation for Home, Current Workshop, Past Workshops, and FAQ.
- July through December monthly hub shells, with July set as the current member month.
- July prerequisite page for the first member release: GitHub, Lovable, Mastery Hub, Claude Desktop, and active Claude Pro/Max/Team access.
- June content is kept in source as the old Month 6 template and surfaced through Past Workshops with workshop and challenge links merged into one card.
- Plan 2 V1 direction: Launch Base plus the working Challenge OS foundation.
- Challenge submission form with local preview storage and Supabase handoff.
- FAQ page structure for member onboarding and routing help.
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

## Analytics

Production logs lightweight UI events to Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel.

Production also expects these Vercel environment variables:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_MASTERY_ACCESS_GATE` (`off`, `community`, or `claim`; default is `off`)
- `VITE_MASTERY_ACCESS_CLAIM_PATHS` (optional comma-separated Clerk claim or metadata paths for `claim` mode)
- `VITE_MASTERY_ACCESS_ALLOWED_VALUES` (optional comma-separated values that grant `claim` mode access)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MASTERY_ADMIN_TOKEN`

## Access gate

The site stays public unless `VITE_MASTERY_ACCESS_GATE` is enabled.

- `off`: current public behavior. This is the rollback switch.
- `community`: require a signed-in Clerk session. This works with the current app shape and is effectively community-wide.
- `claim`: require sign-in plus a Mastery-specific Clerk claim or public metadata value. This is the Mastery-area-only option, but it only works once Circle or another sync writes a reliable Mastery entitlement into Clerk.

Suggested claim-mode env setup once the entitlement exists:

```text
VITE_MASTERY_ACCESS_GATE=claim
VITE_MASTERY_ACCESS_CLAIM_PATHS=metadata.mastery_area,public_metadata.mastery_area,publicMetadata.mastery_area
VITE_MASTERY_ACCESS_ALLOWED_VALUES=mastery,true,active,member,access
```

Emergency rollback options:

```bash
# Fastest: turn the gate off in Vercel and redeploy/restart the project env.
VITE_MASTERY_ACCESS_GATE=off

# Code rollback anchor created before the gate work:
git checkout public-before-clerk-gate-2026-07-30
```

Tracked today:

- `page_view`
- `ask_ai_click`
- `ask_mods_click`
- `copy_prompt_click`

Events are inserted into `mastery_site_events` with RLS enabled. Anonymous visitors can insert approved event names only; public reads are not granted. Use admin/service credentials to query counts:

```sql
select event_date, event_name, guide_name, step_number, step_title, clicks, unique_sessions
from mastery_site_help_click_counts
order by event_date desc, event_name, step_number;
```

## Local commands

```bash
npm install
npm run dev
npm run build
```

## Routes

- `/`
- `/monthly-resources/july`
- `/past-workshops`
- `/faq`

Legacy broad routes such as `/monthly-resources`, `/challenges`, `/monthly-hubs`, `/submit`, and `/tutorial` redirect into the current navigation.

## Next integrations

- Replace the Clerk-ready placeholder with real Clerk components and membership claims.
- Add Clerk membership claims and protected routes.
- Feed monthly hub content from markdown or database records.
- Build the Plan 3 Mastery Campus roadmap.
