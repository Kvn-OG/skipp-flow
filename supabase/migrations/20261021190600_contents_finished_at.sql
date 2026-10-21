-- =====================================================================
-- 007 · Data de conclusão dos conteúdos
-- Necessária para o indicador "Concluídos no mês" do dashboard.
-- Preenchida quando o conteúdo chega em Finalizado ou Publicado e
-- limpa se ele voltar para uma etapa anterior.
-- =====================================================================

alter table public.contents add column finished_at timestamptz;

create or replace function private.contents_sync_finished_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.production_status in ('finished', 'published') then
    if new.finished_at is null then
      new.finished_at = now();
    end if;
  else
    new.finished_at = null;
  end if;
  return new;
end;
$$;

create trigger contents_sync_finished_at
  before insert or update of production_status on public.contents
  for each row execute function private.contents_sync_finished_at();

create index contents_finished_at_idx on public.contents (finished_at);
