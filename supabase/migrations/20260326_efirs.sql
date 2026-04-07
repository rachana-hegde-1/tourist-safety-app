create table if not exists public.efirs (
  id bigint generated always as identity primary key,
  case_number text not null unique,
  alert_id bigint not null,
  tourist_id text not null,
  admin_clerk_id text not null,
  report_datetime timestamptz not null,

  tourist_full_name text,
  tourist_nationality text,
  tourist_id_type text,
  tourist_id_number text,

  last_known_lat double precision,
  last_known_lng double precision,
  last_known_maps_url text,

  last_gps_signal_at timestamptz,
  last_wearable_signal_at timestamptz,

  alert_type text,
  alert_description text,

  emergency_contacts jsonb,
  itinerary jsonb,

  admin_notes text,

  created_at timestamptz not null default now()
);

create index if not exists efirs_alert_id_idx on public.efirs (alert_id);
create index if not exists efirs_tourist_id_idx on public.efirs (tourist_id);
create index if not exists efirs_admin_clerk_id_idx on public.efirs (admin_clerk_id);

