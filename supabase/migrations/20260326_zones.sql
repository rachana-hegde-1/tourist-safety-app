create table if not exists public.zones (
  id bigint generated always as identity primary key,
  name text not null,
  type text not null check (type in ('Safe', 'Unsafe')),
  center_lat double precision not null,
  center_lng double precision not null,
  radius_meters double precision not null check (radius_meters > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zones_active_idx on public.zones (active);

