-- Tracker categories (e.g., Weight, Height, Bench Press)
create table public.tracker_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  unit text not null,
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tracker_categories_user on public.tracker_categories(user_id);

alter table public.tracker_categories enable row level security;

create policy "Users can view own tracker_categories" on public.tracker_categories for select using (auth.uid() = user_id);
create policy "Users can insert own tracker_categories" on public.tracker_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own tracker_categories" on public.tracker_categories for update using (auth.uid() = user_id);
create policy "Users can delete own tracker_categories" on public.tracker_categories for delete using (auth.uid() = user_id);

create trigger on_tracker_category_updated before update on public.tracker_categories
  for each row execute function public.handle_updated_at();

-- Tracker measurements (data points for a category)
create table public.tracker_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.tracker_categories(id) on delete cascade not null,
  value numeric(14,4) not null,
  measured_date date not null,
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tracker_measurements_category_date on public.tracker_measurements(category_id, measured_date);
create index idx_tracker_measurements_user on public.tracker_measurements(user_id);

alter table public.tracker_measurements enable row level security;

create policy "Users can view own tracker_measurements" on public.tracker_measurements for select using (auth.uid() = user_id);
create policy "Users can insert own tracker_measurements" on public.tracker_measurements for insert with check (auth.uid() = user_id);
create policy "Users can update own tracker_measurements" on public.tracker_measurements for update using (auth.uid() = user_id);
create policy "Users can delete own tracker_measurements" on public.tracker_measurements for delete using (auth.uid() = user_id);

create trigger on_tracker_measurement_updated before update on public.tracker_measurements
  for each row execute function public.handle_updated_at();
