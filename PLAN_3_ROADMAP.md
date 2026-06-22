# Plan 3 Roadmap: Mastery Campus

Plan 2 gives Mastery members a real home: monthly hubs, challenge submissions, an archive, tutorial support, Clerk-ready auth, and a Supabase-ready intake path.

Plan 3 turns that hub into the full Mastery Campus: a premium learning operating system for progress, events, resources, submissions, member wins, and personalized next steps.

## Product Principle

The hub should feel like the home base for a high-ticket Mastery member, not a folder of links.

Every screen should answer one of four member questions:

- What should I work on this month?
- What have I already completed?
- Where do I submit or review challenge work?
- What is the next best action for me?

## Phase 1: Real Auth And Member Context

Goal: connect the placeholder auth layer to the actual AI Advantage Club SSO path.

Scope:

- Replace the current "Clerk ready" placeholder with real Clerk components.
- Map Clerk user claims to Mastery access.
- Add signed-in, signed-out, and unauthorized states.
- Store member profile basics for later personalization.
- Add an admin-only preview mode for Igor and the team.

Acceptance:

- Mastery members can log in with the same SSO flow used by the Club.
- Non-members cannot access protected hub content.
- Admins can preview all months and submission states.

## Phase 2: Content Management For Monthly Hubs

Goal: make June through December editable without code changes.

Scope:

- Create a `mastery_months` table for month metadata, status, hero copy, and publish state.
- Create a `mastery_resources` table for replays, downloads, prompts, slides, worksheets, and links.
- Preserve the monthly resource pattern: guide, prompt pack, challenge document, and challenge winner slot.
- Add resource types, visibility rules, and sort order.
- Build a simple admin content editor or seed script.
- Add draft, scheduled, and published states.

Acceptance:

- The team can update a month without redeploying the app.
- Members only see published content.
- Each month has a consistent structure but can handle different content mixes.

## Phase 3: Challenge Review Queue

Goal: make submissions operational for the team, not just collectible.

Scope:

- Save every challenge submission to Supabase.
- Add status states: Submitted, In Review, Featured, Winner, Needs Follow-Up, Archived.
- Add reviewer notes and internal tags.
- Add filters by month, member, status, industry, tool, and use case.
- Add a featured/winner toggle that pushes selected work into the public archive.
- Add notification hooks for member confirmation and team review.

Acceptance:

- Members can submit once per month.
- The team can review, tag, and promote submissions.
- The archive can distinguish raw submissions from featured examples.

## Phase 4: Member Progress Dashboard

Goal: make members feel oriented and motivated every time they log in.

Scope:

- Add a dashboard with this month's checklist.
- Track watched tutorials, opened resources, and submitted challenge work.
- Show progress by month.
- Add a "next best action" panel.
- Add lightweight completion moments for the major monthly actions.

Acceptance:

- Members immediately know what to do next.
- Challenge completion is visible.
- The dashboard does not become a gamified distraction.

## Phase 5: Event And Tutorial Layer

Goal: centralize Mastery live sessions, replays, and orientation.

Scope:

- Add a Mastery events table for live calls, workshops, Q&As, and celebrations.
- Show upcoming events by month.
- Add replay links after sessions.
- Turn the tutorial page into a guided onboarding path.
- Add role-based tutorials for new member, returning member, and challenge submitter.

Acceptance:

- Members can find the next live event and last replay without searching Circle or Notion.
- New members can orient themselves in under five minutes.

## Phase 6: Premium Archive And Showcase

Goal: make the challenge archive a learning asset and a status signal.

Scope:

- Build a searchable showcase view.
- Add filters for month, use case, industry, tool, member type, and winner status.
- Add featured breakdown pages for winning submissions.
- Add "why this worked" notes from the team.
- Add copyable prompts, templates, or implementation notes when relevant.

Acceptance:

- The archive helps members learn from peers.
- Featured submissions feel prestigious.
- The team can build monthly recap content from the archive.

## Phase 7: Admin Operating Layer

Goal: reduce manual coordination for Igor, Daniel, Ariadne, Dirk, and the community team.

Scope:

- Admin dashboard for content readiness by month.
- Submission review metrics.
- Exportable challenge winner shortlist.
- Content gaps view for missing replays, slides, resources, or tutorials.
- Weekly summary for what changed in the hub.

Acceptance:

- The team can see whether a month is launch-ready.
- Missing content is obvious.
- Review and showcase work moves through one place.

## Suggested Database Tables

- `mastery_members`
- `mastery_months`
- `mastery_resources`
- `mastery_events`
- `mastery_challenge_submissions`
- `mastery_submission_reviews`
- `mastery_member_progress`
- `mastery_tutorial_steps`

## Plan 3 Definition Of Done

- Real Clerk auth protects the hub.
- Content is editable without code changes.
- Challenge submissions are reviewed in a proper queue.
- Archive supports search, filtering, featured examples, and winners.
- Members have a dashboard with progress and next actions.
- Admins can manage months, resources, events, tutorials, and challenge review.
- The hub feels like a premium Mastery campus, not a prettier Notion replacement.
