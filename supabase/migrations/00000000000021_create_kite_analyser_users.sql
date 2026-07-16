-- Maps an Atlas user to their user id in the external Kite Analyser project.
-- kite-sync-pnl reads this to translate the Atlas user_id into the id the
-- other project understands before forwarding Kite creds to its kite-holdings
-- function. Kept as its own table so more per-user external linkage can hang
-- off it later.
create table if not exists public.kite_analyser_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kite_analyser_user_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kite_analyser_users enable row level security;

create policy "Users can view own kite analyser mapping" on public.kite_analyser_users
  for select using (auth.uid() = user_id);
create policy "Users can insert own kite analyser mapping" on public.kite_analyser_users
  for insert with check (auth.uid() = user_id);
create policy "Users can update own kite analyser mapping" on public.kite_analyser_users
  for update using (auth.uid() = user_id);
create policy "Users can delete own kite analyser mapping" on public.kite_analyser_users
  for delete using (auth.uid() = user_id);

create trigger on_kite_analyser_users_updated before update on public.kite_analyser_users
  for each row execute function public.handle_updated_at();
