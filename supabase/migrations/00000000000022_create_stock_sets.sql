-- User-defined groupings of stock holdings ("sets", e.g. Core / Speculative).
-- Symbols are Kite tradingsymbols stored as a text[]; holdings themselves live
-- in kite_holdings_snapshots jsonb, so there is no stocks table to reference.
-- A symbol may appear in multiple sets (multi-membership).
create table if not exists public.stock_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  symbols text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stock_sets enable row level security;

create policy "Users can view own stock sets" on public.stock_sets
  for select using (auth.uid() = user_id);
create policy "Users can insert own stock sets" on public.stock_sets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own stock sets" on public.stock_sets
  for update using (auth.uid() = user_id);
create policy "Users can delete own stock sets" on public.stock_sets
  for delete using (auth.uid() = user_id);

create index if not exists stock_sets_user_id_idx on public.stock_sets (user_id);
create unique index if not exists stock_sets_user_name_key
  on public.stock_sets (user_id, lower(name));

create trigger on_stock_sets_updated before update on public.stock_sets
  for each row execute function public.handle_updated_at();
