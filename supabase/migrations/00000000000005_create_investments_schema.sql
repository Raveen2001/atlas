-- Investment P&L logs (one entry per user per trading day)
create table public.investment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null,
  pnl_amount numeric(12,2) not null,
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, logged_date)
);

create index idx_investment_logs_user_date on public.investment_logs(user_id, logged_date);

alter table public.investment_logs enable row level security;

create policy "Users can view own investment_logs" on public.investment_logs for select using (auth.uid() = user_id);
create policy "Users can insert own investment_logs" on public.investment_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own investment_logs" on public.investment_logs for update using (auth.uid() = user_id);
create policy "Users can delete own investment_logs" on public.investment_logs for delete using (auth.uid() = user_id);

create trigger on_investment_log_updated before update on public.investment_logs
  for each row execute function public.handle_updated_at();

-- Investment reminder settings (one row per user)
create table public.investment_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  buy_reminder_enabled boolean not null default true,
  buy_reminder_time time without time zone not null default '15:25',
  log_reminder_enabled boolean not null default true,
  log_reminder_time time without time zone not null default '16:00',
  followup_enabled boolean not null default true,
  end_of_day_time time without time zone not null default '23:00',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.investment_settings enable row level security;

create policy "Users can view own investment_settings" on public.investment_settings for select using (auth.uid() = user_id);
create policy "Users can insert own investment_settings" on public.investment_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own investment_settings" on public.investment_settings for update using (auth.uid() = user_id);

create trigger on_investment_settings_updated before update on public.investment_settings
  for each row execute function public.handle_updated_at();
