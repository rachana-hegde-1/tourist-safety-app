-- 1) Live tracking share links
create table if not exists public.tracking_links (
  id bigint generated always as identity primary key,
  tourist_id text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true
);

create index if not exists tracking_links_tourist_id_idx on public.tracking_links (tourist_id);
create index if not exists tracking_links_token_idx on public.tracking_links (token);

-- 2) PANIC -> Edge Function trigger infrastructure
-- Requires pg_net extension for async HTTP calls from database trigger.
create extension if not exists pg_net;

create or replace function public.notify_emergency_contacts_on_panic()
returns trigger
language plpgsql
security definer
as $$
declare
  supabase_url text := current_setting('app.settings.supabase_url', true);
  service_role_key text := current_setting('app.settings.service_role_key', true);
  req_id bigint;
begin
  if new.type <> 'PANIC' then
    return new;
  end if;

  -- Configure these settings in your Postgres settings (or via ALTER DATABASE SET)
  -- so the trigger can invoke the Edge Function:
  -- app.settings.supabase_url = https://<project-ref>.supabase.co
  -- app.settings.service_role_key = <SUPABASE_SERVICE_ROLE_KEY>
  if supabase_url is null or service_role_key is null then
    return new;
  end if;

  select net.http_post(
    url := supabase_url || '/functions/v1/notify-emergency-contacts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'alert_id', new.id,
      'clerk_user_id', new.clerk_user_id,
      'type', new.type,
      'latitude', new.latitude,
      'longitude', new.longitude,
      'created_at', new.created_at
    )
  ) into req_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_emergency_contacts_on_panic on public.alerts;
create trigger trg_notify_emergency_contacts_on_panic
after insert on public.alerts
for each row
execute function public.notify_emergency_contacts_on_panic();

