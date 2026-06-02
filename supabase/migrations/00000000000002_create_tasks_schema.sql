-- Task status and priority enums
create type public.task_status as enum ('todo', 'in_progress', 'done', 'blocked');
create type public.task_priority as enum ('high', 'medium', 'low');

-- Tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  position integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tasks_user_status on public.tasks(user_id, status);
create index idx_tasks_user_completed on public.tasks(user_id, completed_at);

alter table public.tasks enable row level security;

create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

create trigger on_task_updated before update on public.tasks
  for each row execute function public.handle_updated_at();

-- Tags table
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now() not null,
  unique(user_id, name)
);

alter table public.tags enable row level security;

create policy "Users can view own tags" on public.tags for select using (auth.uid() = user_id);
create policy "Users can insert own tags" on public.tags for insert with check (auth.uid() = user_id);
create policy "Users can update own tags" on public.tags for update using (auth.uid() = user_id);
create policy "Users can delete own tags" on public.tags for delete using (auth.uid() = user_id);

-- Task-Tags junction
create table public.task_tags (
  task_id uuid references public.tasks(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (task_id, tag_id)
);

alter table public.task_tags enable row level security;

create policy "Users can view own task_tags" on public.task_tags for select
  using (exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid()));
create policy "Users can insert own task_tags" on public.task_tags for insert
  with check (exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid()));
create policy "Users can delete own task_tags" on public.task_tags for delete
  using (exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid()));

-- Task Comments
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index idx_task_comments_task on public.task_comments(task_id, created_at);

alter table public.task_comments enable row level security;

create policy "Users can view own task comments" on public.task_comments for select using (auth.uid() = user_id);
create policy "Users can insert own task comments" on public.task_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own task comments" on public.task_comments for delete using (auth.uid() = user_id);
