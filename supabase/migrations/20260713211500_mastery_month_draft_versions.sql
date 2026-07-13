create table if not exists public.mastery_month_draft_versions (
  id uuid primary key default gen_random_uuid(),
  month_slug text not null,
  snapshot jsonb not null,
  source text not null default 'save',
  saved_by text,
  created_at timestamptz not null default now()
);

create index if not exists mastery_month_draft_versions_month_created_idx
on public.mastery_month_draft_versions (month_slug, created_at desc);

alter table public.mastery_month_draft_versions enable row level security;

revoke all on table public.mastery_month_draft_versions from anon, authenticated;
