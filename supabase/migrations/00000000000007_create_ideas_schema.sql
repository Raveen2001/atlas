-- Ideas (quick brain dump)
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  pinned boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_ideas_user on public.ideas(user_id);

alter table public.ideas enable row level security;

create policy "Users can view own ideas" on public.ideas for select using (auth.uid() = user_id);
create policy "Users can insert own ideas" on public.ideas for insert with check (auth.uid() = user_id);
create policy "Users can update own ideas" on public.ideas for update using (auth.uid() = user_id);
create policy "Users can delete own ideas" on public.ideas for delete using (auth.uid() = user_id);

create trigger on_idea_updated before update on public.ideas
  for each row execute function public.handle_updated_at();
