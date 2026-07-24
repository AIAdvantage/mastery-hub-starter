create table if not exists public.mastery_editor_comments (
  id uuid primary key default gen_random_uuid(),
  month_slug text not null,
  document_key text not null,
  selection_start integer not null,
  selection_end integer not null,
  quoted_text text not null,
  body text not null,
  author_id text not null,
  author_name text not null,
  author_email text,
  author_avatar text,
  parent_id uuid references public.mastery_editor_comments(id) on delete cascade,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mastery_editor_comments_valid_range check (selection_start >= 0 and selection_end >= selection_start)
);

create index if not exists mastery_editor_comments_document_idx
on public.mastery_editor_comments (month_slug, document_key, created_at);

create index if not exists mastery_editor_comments_parent_idx
on public.mastery_editor_comments (parent_id, created_at);

alter table public.mastery_editor_comments enable row level security;

revoke all on table public.mastery_editor_comments from anon, authenticated;
