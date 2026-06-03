-- Add status to ideas
alter table public.ideas
  add column status text not null default 'new'
  check (status in ('new', 'exploring', 'in_progress', 'succeeded', 'dropped'));

-- Idea comments
create table public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index idx_idea_comments_idea on public.idea_comments(idea_id, created_at);

alter table public.idea_comments enable row level security;

create policy "Users can view own idea comments" on public.idea_comments for select using (auth.uid() = user_id);
create policy "Users can insert own idea comments" on public.idea_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own idea comments" on public.idea_comments for delete using (auth.uid() = user_id);
