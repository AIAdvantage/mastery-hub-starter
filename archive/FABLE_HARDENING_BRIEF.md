# Fable 5 Hardening Brief: AI Mastery Hub

## Goal

Review this app like a senior product engineer before we keep expanding it.

The live app is the AI Mastery Hub for members at:

- `https://mastery.aiadvantage.com`
- mirror/alias: `https://myhub.alfredos.app`

We are not asking for a redesign. We need a concrete hardening analysis that we can implement.

## Current Product Shape

This is a Vite + React app deployed to Vercel.

Key surfaces:

- Member-facing home, monthly resources, challenge pages, tutorial, June and July content.
- Hidden admin route at `/admin`.
- Vercel serverless API routes in `api/`.
- Supabase-backed CMS drafts for future months.
- Lightweight analytics for page views, Ask AI, Ask mods, and prompt-copy clicks.

Core files to inspect first:

- `src/App.jsx`: member app, routes, hardcoded June/July content, analytics calls, CMS route fallbacks.
- `src/admin/AdminBackend.jsx`: admin content editor and analytics dashboard.
- `api/mastery-admin.js`: token-protected admin API, month draft CRUD, publishing, analytics aggregation, image upload.
- `api/mastery-content.js`: public published-month API.
- `src/lib/analytics.js`: client event logging.
- `src/lib/supabase.js`: browser Supabase client setup.
- `src/config.js`: public client config.
- `src/julyContent.js`: July guide/challenge content constants.
- `src/styles.css`: full app/admin/mobile styling.

## Environment Variables

Do not ask for secrets. Assume these exist in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MASTERY_ADMIN_TOKEN`

The zip intentionally excludes `.env.local`, `.vercel`, `.git`, `node_modules`, and `dist`.

## Non-Negotiable Product Rules

1. Future months must stay unpublished unless an admin explicitly publishes them.
2. Draft content must never leak through public member routes or public APIs.
3. The visible top navigation should not expose `/admin`.
4. Public analytics writes are allowed, public analytics reads are not.
5. Admin analytics should remain token-protected.
6. Existing June and July public routes must keep working.
7. The July Extras title should read `Agent Hub Project Instructions` so it matches the companion video.
8. Prompt variables should use square brackets, for example `[YOUR-EMAIL@gmail.com]`.
9. Mastery guides should be simple and member-ready. Avoid turning every markdown subheading into a separate card.
10. Gold is an accent, not the whole visual system.

## What To Look For

Please produce findings in priority order.

Focus on:

- Security and data exposure risks.
- Admin auth weaknesses or token handling problems.
- Accidental publish/draft leakage paths.
- API method/input validation gaps.
- Supabase RLS assumptions that the code relies on.
- Analytics correctness, overcounting, missing events, or privacy issues.
- CMS data shape issues that will break future months.
- Route fallback bugs between hardcoded June/July and CMS months.
- Mobile/responsive admin problems.
- Build/runtime errors likely to appear on Vercel.
- Maintainability bottlenecks that will slow future months.

## Output Format

Return:

1. Executive verdict: is this safe to keep building on, yes/no/conditional?
2. Top 10 findings, each with:
   - severity: critical/high/medium/low
   - file(s)
   - why it matters
   - exact recommended fix
3. Quick wins that can be implemented in under 30 minutes.
4. Bigger refactors worth scheduling later.
5. A patch plan ordered by implementation priority.

Be honest about what is fine. Do not invent problems just to fill the list.

## Commands

Expected local commands:

```bash
npm install
npm run build
```

There is no full test suite yet.
