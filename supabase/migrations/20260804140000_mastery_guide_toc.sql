alter table public.mastery_month_drafts
add column if not exists guide_toc jsonb not null default '{}'::jsonb;

update public.mastery_month_drafts
set guide_toc = '{"title":"Guide contents","groups":[{"key":"start-here","title":"Start Here"},{"key":"part-1","title":"1 · Run the Demo"},{"key":"part-2","title":"2 · Use Your Own Files"},{"key":"finish","title":"Finish"}],"items":[]}'::jsonb
where slug = 'june' and guide_toc = '{}'::jsonb;

update public.mastery_month_drafts
set guide_toc = '{"title":"Guide contents","groups":[{"key":"start-here","title":"Start Here"},{"key":"part-1","title":"1 · Build the Hub"},{"key":"part-2","title":"2 · Make the Hub Self-Feeding"},{"key":"finish","title":"Finish"}],"items":[]}'::jsonb
where slug = 'july' and guide_toc = '{}'::jsonb;

update public.mastery_month_drafts
set guide_toc = '{"title":"Guide contents","groups":[{"key":"start-here","title":"Start Here"},{"key":"part-1","title":"1 · The Memory"},{"key":"part-2","title":"2 · The Connections"},{"key":"part-3","title":"3 · The Face & The Lock"},{"key":"finish","title":"Finish"}],"items":[{"key":"intro-0","label":"What You’ll Have When Done","group":"start-here"},{"key":"intro-1","label":"Before You Start","group":"start-here"},{"key":"step-1","label":"Build the Book","group":"part-1"},{"key":"step-2","label":"Add a Notes Column","group":"part-1"},{"key":"step-3","label":"Turn It Into a Tool","group":"part-1"},{"key":"step-4","label":"Track Upcoming Birthdays","group":"part-1"},{"key":"step-5","label":"A Place for Your DNA Files","group":"part-1"},{"key":"step-6","label":"Connect Gmail","group":"part-2"},{"key":"step-7","label":"Let It Run on Its Own","group":"part-2"},{"key":"step-8","label":"Hand Over the Calendar Keys","group":"part-2"},{"key":"step-9","label":"Let the Curtain Fall","group":"part-3"},{"key":"step-10","label":"Lock It Down","group":"part-3"},{"key":"closing-0","label":"What’s Next: The Workshop","group":"finish"},{"key":"closing-1","label":"Safety & Privacy","group":"finish"}]}'::jsonb
where slug = 'august' and guide_toc = '{}'::jsonb;
