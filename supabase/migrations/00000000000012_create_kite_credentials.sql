-- Kite Connect access token storage (one row per user)
create table public.kite_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kite_user_id text not null,
  kite_username text,
  kite_broker text,
  access_token text not null,
  public_token text,
  login_time timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.kite_credentials enable row level security;

create policy "Users can view own kite credentials" on public.kite_credentials for select using (auth.uid() = user_id);
create policy "Users can insert own kite credentials" on public.kite_credentials for insert with check (auth.uid() = user_id);
create policy "Users can update own kite credentials" on public.kite_credentials for update using (auth.uid() = user_id);
create policy "Users can delete own kite credentials" on public.kite_credentials for delete using (auth.uid() = user_id);

create trigger on_kite_credentials_updated before update on public.kite_credentials
  for each row execute function public.handle_updated_at();
