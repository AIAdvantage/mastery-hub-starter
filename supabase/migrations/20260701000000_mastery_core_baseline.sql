create table if not exists public.mastery_month_drafts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  label text not null,
  month_number text,
  topic text,
  focus text,
  outcome text,
  hero jsonb not null default '{}'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  guide_markdown text not null default '',
  guide_toc jsonb not null default '{}'::jsonb,
  challenge_markdown text not null default '',
  challenge_prompt text not null default '',
  prompts jsonb not null default '[]'::jsonb,
  extras jsonb not null default '{}'::jsonb,
  admin_notes text not null default '',
  status text not null default 'draft',
  is_published boolean not null default false,
  published_at timestamptz,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mastery_month_drafts_slug_key
on public.mastery_month_drafts (slug);

create table if not exists public.mastery_site_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  page_url text,
  session_id text,
  guide_name text,
  guide_link text,
  step_number integer,
  step_title text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mastery_site_events_created_idx
on public.mastery_site_events (created_at desc);

drop view if exists public.mastery_site_help_click_counts;
create view public.mastery_site_help_click_counts as
select
  date_trunc('day', created_at)::date as event_date,
  event_name,
  guide_name,
  step_number,
  step_title,
  count(*)::integer as clicks
from public.mastery_site_events
where event_name in ('ask_ai_click', 'ask_mods_click')
group by 1, 2, 3, 4, 5;

create table if not exists public.mastery_challenge_submissions (
  id uuid primary key,
  month text,
  member_name text,
  title text,
  share_link text,
  notes text,
  status text not null default 'Submitted for review',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.mastery_challenge_submissions enable row level security;
grant insert on public.mastery_challenge_submissions to anon, authenticated;
drop policy if exists mastery_challenge_submissions_insert on public.mastery_challenge_submissions;
create policy mastery_challenge_submissions_insert
on public.mastery_challenge_submissions
for insert
to anon, authenticated
with check (true);

create or replace function public.mastery_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mastery_month_drafts_touch_updated_at on public.mastery_month_drafts;
create trigger mastery_month_drafts_touch_updated_at
before update on public.mastery_month_drafts
for each row execute function public.mastery_touch_updated_at();

update public.mastery_month_drafts
set resources = (
  select coalesce(jsonb_agg(
    case
      when resource->>'status' = 'published'
        then resource || '{"is_published": true}'::jsonb
      else resource
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(resources) as resource
)
where jsonb_typeof(resources) = 'array';
