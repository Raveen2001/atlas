-- Add recurring task fields to tasks table
alter table public.tasks
  add column is_recurring boolean not null default false,
  add column recurrence_type text,
  add column recurrence_start_day integer,
  add column recurrence_due_offset integer,
  add column next_recurrence_date date;

create index idx_tasks_recurring on public.tasks(next_recurrence_date)
  where is_recurring and status = 'done';
