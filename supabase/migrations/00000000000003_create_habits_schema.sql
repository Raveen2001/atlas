-- Habit frequency type
create type public.habit_frequency as enum (
  'daily',
  'weekdays',
  'specific_days',
  'times_per_week'
);

-- Habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  frequency_type public.habit_frequency not null default 'daily',
  frequency_days jsonb default '[]'::jsonb,
  frequency_count integer default 1,
  reminder_time time without time zone,
  color text not null default 'blue',
  archived boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_habits_user on public.habits(user_id) where not archived;

alter table public.habits enable row level security;

create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

create trigger on_habit_updated before update on public.habits
  for each row execute function public.handle_updated_at();

-- Habit completion logs
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null,
  created_at timestamptz default now() not null,
  unique(habit_id, logged_date)
);

create index idx_habit_logs_habit_date on public.habit_logs(habit_id, logged_date);
create index idx_habit_logs_user_date on public.habit_logs(user_id, logged_date);

alter table public.habit_logs enable row level security;

create policy "Users can view own habit_logs" on public.habit_logs for select using (auth.uid() = user_id);
create policy "Users can insert own habit_logs" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own habit_logs" on public.habit_logs for delete using (auth.uid() = user_id);
