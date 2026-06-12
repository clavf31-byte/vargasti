-- Email Settings Table
create table if not exists public.email_settings (
  id uuid primary key default gen_random_uuid(),
  categories jsonb default '[]'::jsonb,
  whitelist jsonb default '[]'::jsonb,
  priorities jsonb default '[]'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Only one settings record (system-wide config)
insert into public.email_settings (id) values ('00000000-0000-0000-0000-000000000000')
on conflict do nothing;

-- Enable RLS but allow all reads/writes for now
alter table public.email_settings enable row level security;

create policy "Allow all reads" on public.email_settings
  for select using (true);

create policy "Allow all writes" on public.email_settings
  for update using (true);
