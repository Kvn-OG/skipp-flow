import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CalendarDays, Clock, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { OptionSelect, RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { addDaysISO, describeDue, formatShortDate, isOverdue, todayISO, toISODate } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import {
  CONTENT_FORMATS,
  DONE_STATUSES,
  PRODUCTION_STATUSES,
  findOption,
  type ContentFormat,
  type Option,
  type ProductionStatus,
} from '../lib/options'
import { listClientOptions } from '../services/clients'
import { listContents, updateContentStatus } from '../services/contents'
import { listProjectOptions } from '../services/projects'
import type { ContentWithRelations } from '../types/domain'
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'

const PERIODS = [
  { value: 'week', label: 'Publicação nesta semana', color: '' },
  { value: 'month', label: 'Publicação neste mês', color: '' },
  { value: 'next30', label: 'Próximos 30 dias', color: '' },
] as const satisfies readonly Option[]

type Period = (typeof PERIODS)[number]['value'] | ''

function periodRange(period: Period): { from?: string; to?: string } {
  const now = new Date()
  switch (period) {
    case 'week':
      return { from: toISODate(startOfWeek(now)), to: toISODate(endOfWeek(now)) }
    case 'month':
      return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) }
    case 'next30':
      return { from: todayISO(), to: addDaysISO(todayISO(), 30) }
    default:
      return {}
  }
}

// Primeiro tenta a coluna sob o ponteiro; se não houver (ex.: teclado),
// usa a coluna com maior área de interseção.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

function CardBody({ content, dragging }: { content: ContentWithRelations; dragging?: boolean }) {
  const done = DONE_STATUSES.includes(content.production_status as ProductionStatus)
  const late = !done && isOverdue(content.production_due_date)
  return (
    <div
      className={cn(
        'rounded-xl border bg-surface-2 p-3 text-left transition-shadow',
        dragging ? 'rotate-2 border-pink/60 shadow-2xl shadow-roxo/30' : 'border-line hover:border-line-strong',
      )}
    >
      <Link to={`/conteudos/${content.id}`} className="line-clamp-2 text-sm font-medium hover:text-neon">
        {content.title}
      </Link>
      <p className="mt-0.5 truncate text-xs text-muted">{content.client?.name}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge option={findOption(CONTENT_FORMATS, content.format)} dot={false} className="px-2 text-[11px]" />
        {content.production_due_date && !done && (
          <span className={cn('inline-flex items-center gap-1 text-[11px]', late ? 'font-medium text-red-300' : 'text-muted')}>
            <Clock className="size-3" /> {describeDue(content.production_due_date)}
          </span>
        )}
        {content.scheduled_date && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <CalendarDays className="size-3" /> {formatShortDate(content.scheduled_date)}
          </span>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ content }: { content: ContentWithRelations }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: content.id, data: { content } })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Cartão arrastável"
      aria-label={`${content.title}. Espaço para pegar, setas para mover e espaço para soltar em outra coluna.`}
      className={cn('cursor-grab touch-manipulation rounded-xl active:cursor-grabbing', isDragging && 'opacity-30')}
    >
      <CardBody content={content} />
    </div>
  )
}

function Column({ status, items }: { status: Option; items: ContentWithRelations[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value })
  return (
    <section
      ref={setNodeRef}
      aria-label={status.label}
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-surface/60 transition-colors',
        isOver ? 'border-pink/60 bg-pink/5' : 'border-line',
      )}
    >
      <header className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
        <h2 className="text-sm font-semibold">{status.label}</h2>
        <span className="ml-auto rounded-full bg-white/5 px-2 text-xs text-muted">{items.length}</span>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
        {items.map((content) => (
          <DraggableCard key={content.id} content={content} />
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-subtle">Arraste para cá</p>
        )}
      </div>
    </section>
  )
}

export function PipelinePage() {
  const toast = useToast()
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [format, setFormat] = useState<ContentFormat | ''>('')
  const [period, setPeriod] = useState<Period>('')
  const [active, setActive] = useState<ContentWithRelations | null>(null)

  const clients = useAsync(listClientOptions, [])
  const projects = useAsync(() => listProjectOptions(clientId || undefined), [clientId])
  const range = periodRange(period)
  const { data, loading, error, reload, setData } = useAsync(
    () =>
      listContents({
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        format: format || undefined,
        scheduledFrom: range.from,
        scheduledTo: range.to,
      }),
    [clientId, projectId, format, period],
  )

  const columns = useMemo(() => {
    const groups = new Map<string, ContentWithRelations[]>(PRODUCTION_STATUSES.map((s) => [s.value, []]))
    for (const content of data ?? []) groups.get(content.production_status)?.push(content)
    return groups
  }, [data])

  // distance/delay: um clique simples não vira arrasto (o link do título continua funcionando)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function onDragStart(event: DragStartEvent) {
    setActive((event.active.data.current as { content: ContentWithRelations }).content)
  }

  async function onDragEnd(event: DragEndEvent) {
    setActive(null)
    const content = (event.active.data.current as { content: ContentWithRelations }).content
    const target = event.over?.id as ProductionStatus | undefined
    if (!target || target === content.production_status) return

    // Atualização otimista: move o cartão na tela antes da resposta do banco
    setData((list) => list?.map((c) => (c.id === content.id ? { ...c, production_status: target } : c)))
    try {
      await updateContentStatus(content.id, target)
      toast.success(`"${content.title}" → ${findOption(PRODUCTION_STATUSES, target).label}`)
    } catch (err) {
      // Deu errado: devolve o cartão para a coluna original
      setData((list) => list?.map((c) => (c.id === content.id ? { ...c, production_status: content.production_status } : c)))
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Pipeline de produção"
        description="Arraste os cartões entre as colunas para atualizar o status."
        actions={
          <ButtonLink to="/conteudos/novo">
            <Plus className="size-4" /> Novo conteúdo
          </ButtonLink>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RefSelect
          aria-label="Cliente"
          items={clients.data}
          emptyLabel="Todos os clientes"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value)
            setProjectId('')
          }}
        />
        <RefSelect aria-label="Projeto" items={projects.data} emptyLabel="Todos os projetos" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <OptionSelect
          aria-label="Formato"
          options={CONTENT_FORMATS}
          emptyLabel="Todos os formatos"
          value={format}
          onChange={(e) => setFormat(e.target.value as ContentFormat | '')}
        />
        <OptionSelect aria-label="Período" options={PERIODS} emptyLabel="Qualquer data" value={period} onChange={(e) => setPeriod(e.target.value as Period)} />
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {PRODUCTION_STATUSES.map((status) => (
              <Column key={status.value} status={status} items={columns.get(status.value) ?? []} />
            ))}
          </div>
          {/* Cópia do cartão que acompanha o ponteiro enquanto arrasta */}
          <DragOverlay>{active && <CardBody content={active} dragging />}</DragOverlay>
        </DndContext>
      )}
    </>
  )
}
