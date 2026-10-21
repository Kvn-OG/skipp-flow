-- =====================================================================
-- 006 · Índices para as chaves estrangeiras compostas
-- Apontado pelo Performance Advisor do Supabase: as FKs (project_id,
-- client_id) e (content_id, client_id) precisam de índice com as mesmas
-- colunas para que exclusões e junções não varram a tabela inteira.
-- =====================================================================

create index contents_project_client_idx on public.contents (project_id, client_id);
create index tasks_project_client_idx on public.tasks (project_id, client_id);
create index tasks_content_client_idx on public.tasks (content_id, client_id);
