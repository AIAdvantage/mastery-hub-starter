create table if not exists public.mastery_editor_suggestions (
  id uuid primary key default gen_random_uuid(),
  month_slug text not null,
  document_key text not null,
  suggestion_type text not null check (suggestion_type in ('replacement', 'insertion', 'deletion')),
  selection_start integer not null,
  selection_end integer not null,
  quoted_text text not null,
  replacement_text text not null default '',
  anchor_context jsonb not null default '{}'::jsonb,
  source_revision bigint not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'stale')),
  proposer_id text not null,
  proposer_name text not null,
  proposer_email text,
  proposer_avatar text,
  decided_by text,
  decided_by_name text,
  decided_at timestamptz,
  applied_revision bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mastery_editor_suggestions_valid_range check (selection_start >= 0 and selection_end >= selection_start)
);

create index if not exists mastery_editor_suggestions_document_idx
on public.mastery_editor_suggestions (month_slug, document_key, created_at desc);

alter table public.mastery_editor_suggestions enable row level security;
revoke all on table public.mastery_editor_suggestions from anon, authenticated;
