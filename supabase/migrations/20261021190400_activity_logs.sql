-- =====================================================================
-- 005 · Atividade recente
-- Os registros são gravados pelo próprio banco (triggers), então o
-- histórico não depende do frontend lembrar de registrar nada.
-- O app só tem permissão de LEITURA nesta tabela.
-- =====================================================================

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client', 'project', 'content', 'task')),
  entity_id uuid not null,
  action text not null
    check (action in ('created', 'updated', 'status_changed', 'archived', 'restored', 'completed', 'deleted')),
  description text not null,
  created_at timestamptz not null default now()
);

create index activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);

alter table public.activity_logs enable row level security;

create policy "activity_logs_admin_select" on public.activity_logs
  for select to authenticated
  using ((select private.is_admin()));

revoke all on public.activity_logs from anon, authenticated;
grant select on public.activity_logs to authenticated;

create or replace function private.content_status_label(status text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case status
    when 'idea' then 'Ideia'
    when 'planning' then 'Planejamento'
    when 'script' then 'Roteiro'
    when 'awaiting_recording' then 'Aguardando gravação'
    when 'recording' then 'Gravação'
    when 'editing' then 'Edição'
    when 'internal_review' then 'Revisão interna'
    when 'adjustments' then 'Ajustes'
    when 'finished' then 'Finalizado'
    when 'published' then 'Publicado'
    else status
  end;
$$;

-- security definer: grava no log mesmo sem o usuário ter permissão de
-- INSERT na tabela activity_logs.
-- As linhas são lidas como JSON (to_jsonb) porque a mesma função atende
-- tabelas com colunas diferentes.
create or replace function private.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := tg_argv[0];
  v_fem boolean := tg_argv[0] = 'task';
  v_new jsonb;
  v_old jsonb;
  v_label text;
  v_name text;
  v_action text;
  v_desc text;
begin
  v_label := case v_type
    when 'client' then 'Cliente'
    when 'project' then 'Projeto'
    when 'content' then 'Conteúdo'
    when 'task' then 'Tarefa'
  end;

  if tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_name := coalesce(v_old ->> 'name', v_old ->> 'title');
    insert into public.activity_logs (entity_type, entity_id, action, description)
    values (v_type, old.id, 'deleted',
      format('%s "%s" %s', v_label, v_name, case when v_fem then 'excluída' else 'excluído' end));
    return old;
  end if;

  v_new := to_jsonb(new);
  v_name := coalesce(v_new ->> 'name', v_new ->> 'title');

  if tg_op = 'INSERT' then
    v_action := 'created';
    v_desc := format('%s "%s" %s', v_label, v_name, case when v_fem then 'criada' else 'criado' end);
  else
    v_old := to_jsonb(old);

    if v_type = 'content'
       and (v_new ->> 'production_status') is distinct from (v_old ->> 'production_status') then
      v_action := 'status_changed';
      v_desc := format('Conteúdo "%s" movido para %s', v_name,
        private.content_status_label(v_new ->> 'production_status'));
    elsif v_type in ('content', 'task')
       and (v_new ->> 'archived_at') is distinct from (v_old ->> 'archived_at') then
      v_action := case when v_new ->> 'archived_at' is null then 'restored' else 'archived' end;
      v_desc := format('%s "%s" %s', v_label, v_name,
        case when v_new ->> 'archived_at' is null
             then case when v_fem then 'restaurada' else 'restaurado' end
             else case when v_fem then 'arquivada' else 'arquivado' end end);
    elsif v_type = 'task' and (v_new ->> 'status') is distinct from (v_old ->> 'status') then
      v_action := case when v_new ->> 'status' = 'completed' then 'completed' else 'status_changed' end;
      v_desc := format('Tarefa "%s" %s', v_name,
        case v_new ->> 'status' when 'completed' then 'concluída'
                                when 'in_progress' then 'em andamento'
                                else 'reaberta' end);
    elsif v_type = 'client' and (v_new ->> 'status') is distinct from (v_old ->> 'status') then
      v_action := case when v_new ->> 'status' = 'archived' then 'archived' else 'restored' end;
      v_desc := format('Cliente "%s" %s', v_name,
        case when v_new ->> 'status' = 'archived' then 'arquivado' else 'reativado' end);
    elsif v_type = 'project' and (v_new ->> 'status') is distinct from (v_old ->> 'status') then
      v_action := 'status_changed';
      v_desc := format('Projeto "%s" agora está %s', v_name,
        case v_new ->> 'status' when 'planning' then 'em planejamento'
                                when 'active' then 'ativo'
                                when 'paused' then 'pausado'
                                else 'concluído' end);
    else
      v_action := 'updated';
      v_desc := format('%s "%s" %s', v_label, v_name,
        case when v_fem then 'atualizada' else 'atualizado' end);
    end if;
  end if;

  insert into public.activity_logs (entity_type, entity_id, action, description)
  values (v_type, new.id, v_action, v_desc);
  return new;
end;
$$;

revoke all on function private.log_activity() from public, anon, authenticated;

create trigger clients_log_activity
  after insert or update or delete on public.clients
  for each row execute function private.log_activity('client');

create trigger projects_log_activity
  after insert or update or delete on public.projects
  for each row execute function private.log_activity('project');

create trigger contents_log_activity
  after insert or update or delete on public.contents
  for each row execute function private.log_activity('content');

create trigger tasks_log_activity
  after insert or update or delete on public.tasks
  for each row execute function private.log_activity('task');
