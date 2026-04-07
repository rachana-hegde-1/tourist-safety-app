-- Add digital ID fields to tourists table
alter table public.tourists
  add column if not exists digital_id_hash text,
  add column if not exists digital_id_qr text;

-- Create index for faster lookups by hash
create index if not exists tourists_digital_id_hash_idx on public.tourists (digital_id_hash);
