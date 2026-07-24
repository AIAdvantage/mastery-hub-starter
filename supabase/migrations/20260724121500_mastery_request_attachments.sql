alter table public.mastery_admin_requests
add column if not exists attachments jsonb not null default '[]'::jsonb;
