alter table public.mastery_editor_comments
add column if not exists anchor_context jsonb not null default '{}'::jsonb;
