import { Archive, ArchiveRestore, Clapperboard, Copy, MoreHorizontal, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { OptionSelect, RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { describeDue, formatShortDate, isOverdue } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import {
  CONTENT_FORMATS,
  CONTENT_TYPES,
  DONE_STATUSES,
  PRODUCTION_STATUSES,
  findOption,
  type ContentFormat,
  type ContentType,
  type ProductionStatus,
} from '../lib/options'
import { listClientOptions } from '../services/clients'
import { archiveContent, duplicateContent, listContents, restoreContent } from '../services/contents'
import { listProjectOptions } from '../services/projects'
import type { ContentWithRelations } from '../types/domain'

/** Menu de ações de cada linha (duplicar / arquivar). */
function RowMenu({ content, onDone }: { content: ContentWithRelations; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function run(action: () => Promise<unknown>, message: string, after?: (result: unknown) => void) {
    setOpen(false)
    try {
      const result = await action()
      toast.success(message)
      if (after) after(result)
      else onDone()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const item = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5'

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" aria-label="Ações" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 w-44 animate-fade-in rounded-xl border border-line-strong bg-surface-2 p-1 shadow-xl">
          <button
            type="button"
            className={item}
            onClick={() =>
              run(
                () => duplicateContent(content.id),
                'Conteúdo duplicado.',
                (copy) => navigate(`/conteudos/${(copy as { id: string }).id}/editar`),
              )
            }
          >
            <Copy className="size-4" /> Duplicar
          </button>
          {content.archived_at ? (
            <button type="button" className={item} onClick={() => run(() => restoreContent(content.id), 'Conteúdo restaurado.')}>
              <ArchiveRestore className="size-4" /> Restaurar
            </button>
          ) : (
            <button type="button" className={item} onClick={() => run(() => archiveContent(content.id), 'Conteúdo arquivado.')}>
              <Archive className="size-4" /> Arquivar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ContentsPage() {
  // Os filtros ficam na URL (?cliente=...&status=...): dá para voltar,
  // recarregar ou compartilhar o link sem perder a filtragem.
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)

  const clientId = params.get('cliente') ?? ''
  const projectId = params.get('projeto') ?? ''
  const format = (params.get('formato') ?? '') as ContentFormat | ''
  const contentType = (params.get('tipo') ?? '') as ContentType | ''
  const status = (params.get('status') ?? '') as ProductionStatus | ''
  const archived = params.get('arquivados') === '1'
  const overdue = params.get('atrasados') === '1'

  function setParam(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key === 'cliente') next.delete('projeto')
        return next
      },
      { replace: true },
    )
  }

  const clients = useAsync(listClientOptions, [])
  const projects = useAsync(() => listProjectOptions(clientId || undefined), [clientId])
  const { data, loading, error, reload } = useAsync(
    () =>
      listContents({
        search: debouncedSearch,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        format: format || undefined,
        contentType: contentType || undefined,
        status: status || undefined,
        archived,
        overdue,
      }),
    [debouncedSearch, clientId, projectId, format, contentType, status, archived, overdue],
  )

  const hasFilters = !!(clientId || projectId || format || contentType || status || archived || overdue || search)

  return (
    <>
      <PageHeader
        title="Conteúdos"
        description="Todos os conteúdos para o Instagram dos clientes."
        actions={
          <ButtonLink to="/conteudos/novo">
            <Plus className="size-4" /> Novo conteúdo
          </ButtonLink>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar título, pilar ou legenda" className="sm:col-span-2 lg:col-span-1" />
          <RefSelect aria-label="Cliente" items={clients.data} emptyLabel="Todos os clientes" value={clientId} onChange={(e) => setParam('cliente', e.target.value)} />
          <RefSelect aria-label="Projeto" items={projects.data} emptyLabel="Todos os projetos" value={projectId} onChange={(e) => setParam('projeto', e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <OptionSelect aria-label="Status" options={PRODUCTION_STATUSES} emptyLabel="Todos os status" value={status} onChange={(e) => setParam('status', e.target.value)} />
          <OptionSelect aria-label="Formato" options={CONTENT_FORMATS} emptyLabel="Todos os formatos" value={format} onChange={(e) => setParam('formato', e.target.value)} />
          <OptionSelect aria-label="Tipo" options={CONTENT_TYPES} emptyLabel="Todos os tipos" value={contentType} onChange={(e) => setParam('tipo', e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'atrasados', label: 'Só atrasados', active: overdue },
            { key: 'arquivados', label: 'Ver arquivados', active: archived },
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-pressed={chip.active}
              onClick={() => setParam(chip.key, chip.active ? '' : '1')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                chip.active ? 'border-pink/60 bg-pink/15 text-heading' : 'border-line-strong text-muted hover:text-heading',
              )}
            >
              {chip.label}
            </button>
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setParams({}, { replace: true })
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-heading"
            >
              <X className="size-3.5" /> Limpar filtros
            </button>
          )}
        </div>
      </Card>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data?.length ? (
        <Card>
          <p className="border-b border-line px-5 py-3 text-xs text-muted">
            {data.length} conteúdo{data.length === 1 ? '' : 's'}
          </p>
          <ul className="divide-y divide-line">
            {data.map((content) => {
              const done = DONE_STATUSES.includes(content.production_status as ProductionStatus)
              const late = !done && (isOverdue(content.production_due_date) || isOverdue(content.scheduled_date))
              return (
                <li key={content.id} className="flex items-center gap-2 pr-3 transition-colors hover:bg-white/[0.03]">
                  <Link to={`/conteudos/${content.id}`} className="flex min-w-0 flex-1 flex-col gap-2 py-3.5 pl-5 md:flex-row md:items-center md:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{content.title}</p>
                      <p className="truncate text-xs text-muted">
                        {[content.client?.name, content.project?.name, content.editorial_pillar].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Badge option={findOption(CONTENT_FORMATS, content.format)} dot={false} />
                      <Badge option={findOption(PRODUCTION_STATUSES, content.production_status)} />
                      <span className={cn('w-28 text-xs', late ? 'font-medium text-red-300' : 'text-muted')}>
                        {content.production_due_date && !done
                          ? `Prazo: ${describeDue(content.production_due_date)}`
                          : content.scheduled_date
                            ? `Publica ${formatShortDate(content.scheduled_date)}`
                            : 'Sem datas'}
                      </span>
                    </div>
                  </Link>
                  <RowMenu content={content} onDone={reload} />
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Clapperboard />}
            title={hasFilters ? 'Nenhum conteúdo com esses filtros' : 'Nenhum conteúdo cadastrado'}
            description={hasFilters ? 'Ajuste ou limpe os filtros.' : 'Crie o primeiro conteúdo para começar o planejamento.'}
            action={
              !hasFilters && (
                <ButtonLink to="/conteudos/novo">
                  <Plus className="size-4" /> Novo conteúdo
                </ButtonLink>
              )
            }
          />
        </Card>
      )}
    </>
  )
}
