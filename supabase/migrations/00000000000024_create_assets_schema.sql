-- Assets: physical purchases the user wants to track
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'other' check (category in ('electronics', 'appliance', 'furniture', 'vehicle', 'fitness', 'kitchen', 'jewellery', 'other')),
  purchase_date date not null,
  purchase_price numeric(12,2) not null,
  current_value numeric(12,2),
  warranty_expiry date,
  serial_number text,
  retailer text,
  status text not null default 'active' check (status in ('active', 'sold', 'disposed')),
  sold_price numeric(12,2),
  sold_date date,
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_assets_user on public.assets(user_id);

alter table public.assets enable row level security;

create policy "Users can view own assets" on public.assets for select using (auth.uid() = user_id);
create policy "Users can insert own assets" on public.assets for insert with check (auth.uid() = user_id);
create policy "Users can update own assets" on public.assets for update using (auth.uid() = user_id);
create policy "Users can delete own assets" on public.assets for delete using (auth.uid() = user_id);

create trigger on_asset_updated before update on public.assets
  for each row execute function public.handle_updated_at();
