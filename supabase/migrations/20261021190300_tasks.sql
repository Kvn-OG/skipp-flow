-- =====================================================================
-- 004 · Tarefas e checklist
-- Cliente, projeto e conteúdo são opcionais, mas precisam ser coerentes:
-- se a tarefa aponta para um projeto/conteúdo, o cliente é o dele.
-- =====================================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete restrict,
  project_id uuid,
  content_id uuid,
  title text not null check (length(trim(title)) > 0),
  description text,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  due_date date,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_project_same_client_fk
    foreign key (project_id, client_id)
    references public.projects (id, client_id)
    on delete set null (project_id),
  constraint tasks_content_same_client_fk
    foreign key (content_id, client_id)
    references public.contents (id, client_id)
    on delete set null (content_id)
);

create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_content_id_idx on public.tasks (content_id);
create index tasks_status_due_idx on public.tasks (status, due_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function private.set_updated_at();

-- Antes de salvar:
-- 1) Preenche o cliente a partir do conteúdo/projeto, se vier vazio
--    (as FKs compostas só validam quando client_id está preenchido).
-- 2) Mantém completed_at coerente com o status.
create or replace function private.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_id is null and new.content_id is not null then
    select c.client_id into new.client_id from public.contents c where c.id = new.content_id;
  end if;
  if new.client_id is null and new.project_id is not null then
    select p.client_id into new.client_id from public.projects p where p.id = new.project_id;
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;

  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  is_completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index task_checklist_items_task_id_idx on public.task_checklist_items (task_id, position);

alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;

create policy "tasks_admin_all" on public.tasks
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "task_checklist_items_admin_all" on public.task_checklist_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.tasks, public.task_checklist_items from anon;
grant select, insert, update, delete on public.tasks, public.task_checklist_items to authenticated;
