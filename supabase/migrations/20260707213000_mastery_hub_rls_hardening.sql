alter table public.mastery_month_drafts enable row level security;
alter table public.mastery_site_events enable row level security;

revoke all on table public.mastery_month_drafts from anon, authenticated;
revoke all on table public.mastery_site_events from anon, authenticated;
revoke all on table public.mastery_site_help_click_counts from anon, authenticated;

grant insert on table public.mastery_site_events to anon, authenticated;

drop policy if exists "Allow anonymous mastery event inserts" on public.mastery_site_events;

create policy "Allow anonymous mastery event inserts"
on public.mastery_site_events
for insert
to anon, authenticated
with check (
  event_name = any (array[
    'ask_ai_click',
    'ask_mods_click',
    'copy_prompt_click',
    'page_view'
  ])
);
