-- =====================================================================
-- 001 · Base de segurança
-- - Schema "private": funções internas que NÃO ficam expostas na API.
-- - Tabela "admins": lista de usuários com acesso ao SKIPP Flow.
-- - private.is_admin(): usada por todas as políticas RLS.
-- - private.set_updated_at(): trigger que atualiza "updated_at".
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Quem pode usar o sistema. Mesmo que alguém consiga criar uma conta,
-- sem uma linha aqui não enxerga nem altera nenhum dado.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins_select_self"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- security definer: roda com permissão do dono da função, então consegue
-- ler "admins" sem depender das políticas da própria tabela.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
