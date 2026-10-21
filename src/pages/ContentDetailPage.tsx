import { Archive, ArchiveRestore, ArrowLeft, CalendarDays, Check, Clock, Copy, ExternalLink, Pencil } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ContentAssets } from '../components/contents/ContentAssets'
import { TasksPanel } from '../components/tasks/TasksPanel'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { OptionSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { describeDue, formatDate, formatLongDate, isOverdue } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { CONTENT_FORMATS, CONTENT_TYPES, DONE_STATUSES, PRODUCTION_STATUSES, findOption, type ProductionStatus } from '../lib/options'
import { archiveContent, duplicateContent, getContent, restoreContent, updateContentStatus } from '../services/contents'

function TextBlock({ title, text, copyable }: { title: string; text: string | null; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null

  async function copy() {
    await navigator.clipboard.writeText(text ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {copyable && (
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        )}
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{text}</p>
    </Card>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-subtle">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  )
}

export function ContentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const content = useAsync(() => getContent(id), [id])
  const [busy, setBusy] = useState(false)

  if (content.loading && !content.data) return <LoadingState />
  if (content.error || !content.data) return <ErrorState message={content.error ?? 'Conteúdo não encontrado.'} onRetry={content.reload} />

  const c = content.data
  const done = DONE_STATUSES.includes(c.production_status as ProductionStatus)

  async function changeStatus(status: ProductionStatus) {
    try {
      await updateContentStatus(c.id, status)
      content.reload()
      toast.success(`Status alterado para ${findOption(PRODUCTION_STATUSES, status).label}.`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function run(action: () => Promise<{ id: string }>, message: string, goToResult = false) {
    setBusy(true)
    try {
      const result = await action()
      toast.success(message)
      if (goToResult) navigate(`/conteudos/${result.id}/editar`)
      else content.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/conteudos" className="inline-flex items-center gap-1 hover:text-heading">
            <ArrowLeft className="size-3.5" /> Conteúdos
          </Link>
        }
        title={c.title}
        description={
          <span className="flex flex-wrap items-center gap-x-2">
            {c.client && (
              <Link to={`/clientes/${c.client.id}`} className="hover:text-neon">
                {c.client.name}
              </Link>
            )}
            {c.project && (
              <>
                <span aria-hidden>·</span>
                <Link to={`/projetos/${c.project.id}`} className="hover:text-neon">
                  {c.project.name}
                </Link>
              </>
            )}
            {c.archived_at && <span className="text-warning">· Arquivado</span>}
          </span>
        }
        actions={
          <>
            <ButtonLink to={`/conteudos/${c.id}/editar`} variant="secondary">
              <Pencil className="size-4" /> Editar
            </ButtonLink>
            <Button variant="ghost" disabled={busy} onClick={() => run(() => duplicateContent(c.id), 'Conteúdo duplicado.', true)}>
              <Copy className="size-4" /> Duplicar
            </Button>
            {c.archived_at ? (
              <Button variant="ghost" disabled={busy} onClick={() => run(() => restoreContent(c.id), 'Conteúdo restaurado.')}>
                <ArchiveRestore className="size-4" /> Restaurar
              </Button>
            ) : (
              <Button variant="ghost" disabled={busy} onClick={() => run(() => archiveContent(c.id), 'Conteúdo arquivado.')}>
                <Archive className="size-4" /> Arquivar
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3">
              <label htmlFor="status" className="text-xs text-subtle">
                Status de produção
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <OptionSelect
                  id="status"
                  options={PRODUCTION_STATUSES}
                  value={c.production_status}
                  onChange={(e) => changeStatus(e.target.value as ProductionStatus)}
                  className="min-w-56"
                />
                <Badge option={findOption(PRODUCTION_STATUSES, c.production_status)} />
              </div>
            </div>
            <Meta label="Formato">
              <Badge option={findOption(CONTENT_FORMATS, c.format)} dot={false} />
            </Meta>
            <Meta label="Tipo">{findOption(CONTENT_TYPES, c.content_type).label}</Meta>
            <Meta label="Pilar editorial">{c.editorial_pillar ?? '—'}</Meta>
            <Meta label="Prazo de produção">
              <span className={cn('inline-flex items-center gap-1', !done && isOverdue(c.production_due_date) && 'text-red-300')}>
                <Clock className="size-3.5" />
                {c.production_due_date ? `${formatDate(c.production_due_date)} · ${describeDue(c.production_due_date)}` : '—'}
              </span>
            </Meta>
            <Meta label="Publicação prevista">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatLongDate(c.scheduled_date)}
              </span>
            </Meta>
            <Meta label="Publicado em">{c.published_at ? formatDate(c.published_at) : '—'}</Meta>
            {c.final_asset_url && (
              <div className="col-span-2 sm:col-span-3">
                <a
                  href={c.final_asset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-neon hover:underline"
                >
                  <ExternalLink className="size-4" /> Abrir arquivos finais
                </a>
              </div>
            )}
          </Card>

          <TextBlock title="Briefing" text={c.briefing} />
          <TextBlock title="Objetivo" text={c.objective} />
          <TextBlock title="Roteiro" text={c.script} copyable />
          <TextBlock title="Legenda" text={c.caption} copyable />
          <TextBlock title="CTA" text={c.call_to_action} copyable />
          {!c.briefing && !c.objective && !c.script && !c.caption && !c.call_to_action && (
            <Card className="p-5 text-sm text-muted">
              Briefing, roteiro e legenda ainda não foram preenchidos.{' '}
              <Link to={`/conteudos/${c.id}/editar`} className="text-neon hover:underline">
                Preencher agora
              </Link>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {c.internal_notes && (
            <Card className="border-pink/20 bg-pink/5 p-5">
              <p className="mb-1 text-xs font-medium text-neon">Observações internas</p>
              <p className="text-sm whitespace-pre-line text-muted">{c.internal_notes}</p>
            </Card>
          )}
          <ContentAssets contentId={c.id} />
          <TasksPanel filters={{ contentId: c.id }} defaults={{ client_id: c.client_id, project_id: c.project_id ?? undefined, content_id: c.id }} />
        </div>
      </div>
    </>
  )
}
