-- =====================================================================
-- 003 · Conteúdos e arquivos dos conteúdos
-- Todo conteúdo é para o Instagram do cliente (não há campo de canal).
-- =====================================================================

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid,
  title text not null check (length(trim(title)) > 0),
  format text not null default 'reels'
    check (format in ('reels', 'static_post', 'carousel', 'stories', 'other')),
  content_type text not null default 'educational'
    check (content_type in (
      'educational', 'institutional', 'commercial', 'authority', 'behind_the_scenes',
      'social_proof', 'entertainment', 'commemorative', 'other'
    )),
  editorial_pillar text,
  briefing text,
  objective text,
  script text,
  caption text,
  call_to_action text,
  production_status text not null default 'idea'
    check (production_status in (
      'idea', 'planning', 'script', 'awaiting_recording', 'recording',
      'editing', 'internal_review', 'adjustments', 'finished', 'published'
    )),
  production_due_date date,
  scheduled_date date,
  final_asset_url text,
  internal_notes text,
  archived_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- O projeto (se houver) precisa ser do MESMO cliente do conteúdo.
  -- Se o projeto for apagado, só project_id vira null (client_id fica).
  constraint contents_project_same_client_fk
    foreign key (project_id, client_id)
    references public.projects (id, client_id)
    on delete set null (project_id),
  constraint contents_id_client_unique unique (id, client_id)
);

create index contents_client_id_idx on public.contents (client_id);
create index contents_project_id_idx on public.contents (project_id);
create index contents_status_idx on public.contents (production_status);
create index contents_scheduled_date_idx on public.contents (scheduled_date);

create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function private.set_updated_at();

-- Marca/desmarca automaticamente a data de publicação.
create or replace function private.contents_sync_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.production_status = 'published' and new.published_at is null then
    new.published_at = now();
  elsif new.production_status <> 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

create trigger contents_sync_published_at
  before insert or update of production_status on public.contents
  for each row execute function private.contents_sync_published_at();

create table public.content_assets (
  id uuid primary key default gen_random_uuid(),
  -- cascade: apagar o conteúdo apaga os links dele.
  content_id uuid not null references public.contents (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  url text not null check (url ~* '^https?://'),
  kind text not null default 'other'
    check (kind in ('raw_video', 'final_video', 'art', 'reference', 'document', 'drive_folder', 'other')),
  description text,
  created_at timestamptz not null default now()
);

create index content_assets_content_id_idx on public.content_assets (content_id);

alter table public.contents enable row level security;
alter table public.content_assets enable row level security;

create policy "contents_admin_all" on public.contents
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "content_assets_admin_all" on public.content_assets
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.contents, public.content_assets from anon;
grant select, insert, update, delete on public.contents, public.content_assets to authenticated;
