alter table public.mastery_month_drafts
add column if not exists guide_toc jsonb not null default '{}'::jsonb;
