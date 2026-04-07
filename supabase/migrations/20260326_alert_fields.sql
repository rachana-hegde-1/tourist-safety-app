alter table public.alerts
  add column if not exists status text not null default 'OPEN',
  add column if not exists message text;

create index if not exists alerts_type_idx on public.alerts (type);
create index if not exists alerts_created_at_idx on public.alerts (created_at desc);
create index if not exists alerts_status_idx on public.alerts (status);

