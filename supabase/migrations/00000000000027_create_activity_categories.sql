-- User-defined activity categories, alongside the built-in presets
create table public.activity_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#71717a',
  default_rating text not null default 'neutral' check (default_rating in ('productive', 'neutral', 'wasted')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_activity_categories_user on public.activity_categories(user_id);

alter table public.activity_categories enable row level security;

create policy "Users can view own activity categories" on public.activity_categories for select using (auth.uid() = user_id);
create policy "Users can insert own activity categories" on public.activity_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own activity categories" on public.activity_categories for update using (auth.uid() = user_id);
create policy "Users can delete own activity categories" on public.activity_categories for delete using (auth.uid() = user_id);

create trigger on_activity_category_updated before update on public.activity_categories
  for each row execute function public.handle_updated_at();

-- activities.category now holds either a preset key or an activity_categories id
alter table public.activities drop constraint activities_category_check;
