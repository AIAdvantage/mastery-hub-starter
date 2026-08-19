alter table public.mastery_month_drafts
add column if not exists revision bigint not null default 0;

create index if not exists mastery_month_drafts_revision_idx
on public.mastery_month_drafts (slug, revision);

create table if not exists public.mastery_editor_leases (
  month_slug text not null,
  document_key text not null,
  holder_session text not null,
  holder_id text not null,
  holder_name text not null,
  holder_email text,
  holder_avatar text,
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (month_slug, document_key)
);

create index if not exists mastery_editor_leases_expiry_idx
on public.mastery_editor_leases (expires_at);

alter table public.mastery_editor_leases enable row level security;
revoke all on table public.mastery_editor_leases from anon, authenticated;

create or replace function public.mastery_acquire_editor_lease(
  p_month_slug text,
  p_document_key text,
  p_holder_session text,
  p_holder_id text,
  p_holder_name text,
  p_holder_email text default null,
  p_holder_avatar text default null,
  p_ttl_seconds integer default 30
)
returns table (
  granted boolean,
  holder_session text,
  holder_id text,
  holder_name text,
  holder_email text,
  holder_avatar text,
  acquired_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mastery_editor_leases as lease (
    month_slug, document_key, holder_session, holder_id, holder_name,
    holder_email, holder_avatar, acquired_at, updated_at, expires_at
  ) values (
    lower(trim(p_month_slug)), left(trim(p_document_key), 80), p_holder_session,
    p_holder_id, p_holder_name, nullif(p_holder_email, ''), nullif(p_holder_avatar, ''),
    now(), now(), now() + make_interval(secs => greatest(10, least(p_ttl_seconds, 120)))
  )
  on conflict (month_slug, document_key) do update set
    holder_session = excluded.holder_session,
    holder_id = excluded.holder_id,
    holder_name = excluded.holder_name,
    holder_email = excluded.holder_email,
    holder_avatar = excluded.holder_avatar,
    acquired_at = case
      when lease.holder_session = excluded.holder_session then lease.acquired_at
      else now()
    end,
    updated_at = now(),
    expires_at = excluded.expires_at
  where lease.expires_at <= now() or lease.holder_session = excluded.holder_session;

  return query
  select
    current_lease.holder_session = p_holder_session,
    current_lease.holder_session,
    current_lease.holder_id,
    current_lease.holder_name,
    current_lease.holder_email,
    current_lease.holder_avatar,
    current_lease.acquired_at,
    current_lease.updated_at,
    current_lease.expires_at
  from public.mastery_editor_leases current_lease
  where current_lease.month_slug = lower(trim(p_month_slug))
    and current_lease.document_key = left(trim(p_document_key), 80);
end;
$$;

create or replace function public.mastery_release_editor_lease(
  p_month_slug text,
  p_document_key text,
  p_holder_session text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.mastery_editor_leases
  where month_slug = lower(trim(p_month_slug))
    and document_key = left(trim(p_document_key), 80)
    and holder_session = p_holder_session;
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.mastery_acquire_editor_lease(text, text, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.mastery_release_editor_lease(text, text, text) from public, anon, authenticated;
grant execute on function public.mastery_acquire_editor_lease(text, text, text, text, text, text, text, integer) to service_role;
grant execute on function public.mastery_release_editor_lease(text, text, text) to service_role;
