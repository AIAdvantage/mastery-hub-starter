create table if not exists public.mastery_admin_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  area text not null default 'Platform',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'new' check (status in ('new', 'planned', 'in-progress', 'done')),
  team_notes text,
  submitted_by text not null,
  submitted_by_name text not null,
  submitted_by_email text,
  submitted_by_avatar text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mastery_admin_requests_status_idx
on public.mastery_admin_requests (status, created_at desc);

create table if not exists public.mastery_admin_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mastery_admin_requests(id) on delete cascade,
  body text not null,
  author_id text not null,
  author_name text not null,
  author_email text,
  author_avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mastery_admin_request_comments_request_idx
on public.mastery_admin_request_comments (request_id, created_at);

alter table public.mastery_admin_requests enable row level security;
alter table public.mastery_admin_request_comments enable row level security;

revoke all on table public.mastery_admin_requests from anon, authenticated;
revoke all on table public.mastery_admin_request_comments from anon, authenticated;
