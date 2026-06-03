-- Custom reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  note text,
  remind_time time without time zone not null,
  remind_date date,
  recurrence text not null default 'once' check (recurrence in ('once', 'daily', 'weekdays')),
  enabled boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_reminders_user on public.reminders(user_id) where enabled;

alter table public.reminders enable row level security;

create policy "Users can view own reminders" on public.reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.reminders for delete using (auth.uid() = user_id);

create trigger on_reminder_updated before update on public.reminders
  for each row execute function public.handle_updated_at();
