-- =====================================================================
-- 002 · Clientes e projetos
-- Um cliente tem muitos projetos (1:N). Um projeto pertence a exatamente
-- um cliente. Clientes não são apagados, e sim arquivados (status).
-- =====================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  contact_name text,
  email text,
  phone text,
  instagram_username text,
  instagram_url text,
  description text,
  internal_notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_status_idx on public.clients (status);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function private.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  -- restrict: impede apagar um cliente que ainda tem projetos.
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'planning'
    check (status in ('planning', 'active', 'paused', 'completed')),
  start_date date,
  end_date date,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_check check (end_date is null or start_date is null or end_date >= start_date),
  -- Permite que outras tabelas exijam "projeto X é do cliente Y".
  constraint projects_id_client_unique unique (id, client_id)
);

create index projects_client_id_idx on public.projects (client_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- RLS: só administradores leem e escrevem.
alter table public.clients enable row level security;
alter table public.projects enable row level security;

create policy "clients_admin_all" on public.clients
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "projects_admin_all" on public.projects
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.clients, public.projects from anon;
grant select, insert, update, delete on public.clients, public.projects to authenticated;
