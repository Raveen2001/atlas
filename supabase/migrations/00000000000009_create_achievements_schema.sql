-- Achievements (log wins, with images/videos, grouped by date)
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  achieved_date date not null default current_date,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_achievements_user_date on public.achievements(user_id, achieved_date desc);

alter table public.achievements enable row level security;

create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on public.achievements for insert with check (auth.uid() = user_id);
create policy "Users can update own achievements" on public.achievements for update using (auth.uid() = user_id);
create policy "Users can delete own achievements" on public.achievements for delete using (auth.uid() = user_id);

create trigger on_achievement_updated before update on public.achievements
  for each row execute function public.handle_updated_at();

-- Storage bucket for achievement images/videos
insert into storage.buckets (id, name, public)
values ('achievement-media', 'achievement-media', true)
on conflict (id) do nothing;

-- Users can read any media (bucket is public for easy display via public URL)
create policy "Public read achievement media"
  on storage.objects for select
  using (bucket_id = 'achievement-media');

-- Users can only write/delete their own folder (path starts with their user id)
create policy "Users can upload own achievement media"
  on storage.objects for insert
  with check (
    bucket_id = 'achievement-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own achievement media"
  on storage.objects for update
  using (
    bucket_id = 'achievement-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own achievement media"
  on storage.objects for delete
  using (
    bucket_id = 'achievement-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
