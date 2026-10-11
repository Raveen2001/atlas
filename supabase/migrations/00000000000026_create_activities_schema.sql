-- Activities: time log of what the user did during the day
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text not null default 'other' check (category in (
    'work', 'learning', 'exercise', 'health', 'chores', 'commute', 'social',
    'social_media', 'entertainment', 'rest', 'sleep', 'other'
  )),
  rating text not null default 'neutral' check (rating in ('productive', 'neutral', 'wasted')),
  started_at timestamptz not null,
  -- null while the timer is running
  ended_at timestamptz,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  check (ended_at is null or ended_at > started_at)
);

create index idx_activities_user_started on public.activities(user_id, started_at desc);

-- At most one running timer per user
create unique index idx_activities_one_running on public.activities(user_id) where ended_at is null;

alter table public.activities enable row level security;

create policy "Users can view own activities" on public.activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on public.activities for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on public.activities for update using (auth.uid() = user_id);
create policy "Users can delete own activities" on public.activities for delete using (auth.uid() = user_id);

create trigger on_activity_updated before update on public.activities
  for each row execute function public.handle_updated_at();
