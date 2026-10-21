import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  Flame,
  History,
  Lightbulb,
  ListChecks,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ContentRow } from '../components/contents/ContentRow'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskRow } from '../components/tasks/TaskRow'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { formatLongDate, formatRelative, todayISO } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { getDashboardData } from '../services/dashboard'
import { setTaskStatus } from '../services/tasks'
import type { TaskWithRelations } from '../types/domain'

type StatProps = {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  to: string
  tone?: 'default' | 'danger' | 'success'
}

function Stat({ label, value, hint, icon: Icon, to, tone = 'default' }: StatProps) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-pink/40 hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            tone === 'danger' && value > 0 ? 'bg-danger/15 text-red-300' : tone === 'success' ? 'bg-success/15 text-success' : 'bg-roxo/20 text-neon',
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className={cn('mt-3 font-title text-3xl font-bold', tone === 'danger' && value > 0 && 'text-red-300')}>{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </Link>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload, setData } = useAsync(getDashboardData, [])
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)

  async function completeTask(task: TaskWithRelations) {
    setData((d) => d && { ...d, tasksToday: d.tasksToday.filter((t) => t.id !== task.id) })
    try {
      await setTaskStatus(task.id, 'completed')
      toast.success('Tarefa concluída.')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      reload()
    }
  }

  const name = user?.email?.split('@')[0]

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(todayISO())}
        title={
          <>
            {greeting()}, <span className="text-brand-gradient">{name}</span>
          </>
        }
        description="Visão geral da produção de conteúdo."
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <div className="flex flex-col gap-6">
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <Stat label="Em produção" value={data.counts.inProduction} hint="Do roteiro aos ajustes" icon={Clapperboard} to="/pipeline" />
            <Stat label="Pendentes" value={data.counts.notStarted} hint="Ideia e planejamento" icon={Lightbulb} to="/pipeline" />
            <Stat
              label="Atrasados"
              value={data.counts.overdue}
              hint="Prazo ou publicação vencidos"
              icon={AlertTriangle}
              to="/conteudos?atrasados=1"
              tone="danger"
            />
            <Stat
              label="Concluídos no mês"
              value={data.counts.doneThisMonth}
              hint="Finalizados ou publicados"
              icon={CheckCircle2}
              to="/conteudos"
              tone="success"
            />
            <Stat label="Tarefas abertas" value={data.counts.openTasks} hint="Pendentes e em andamento" icon={ListChecks} to="/tarefas" />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Tarefas do dia" description="Vencem hoje ou estão atrasadas" icon={<Sun />} />
              {data.tasksToday.length ? (
                <ul className="divide-y divide-line">
                  {data.tasksToday.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={() => completeTask(task)} onOpen={() => setEditingTask(task)} />
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={<CheckCircle2 />} title="Nada para hoje" description="Nenhuma tarefa vencendo hoje." />
              )}
            </Card>

            <Card>
              <CardHeader title="Produção prioritária" description="Conteúdos com prazo mais próximo" icon={<Flame />} />
              {data.priority.length ? (
                <ul className="divide-y divide-line">
                  {data.priority.map((content) => (
                    <ContentRow key={content.id} content={content} />
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="Sem prazos definidos" description="Defina o prazo interno dos conteúdos para vê-los aqui." />
              )}
            </Card>

            <Card>
              <CardHeader title="Próximas publicações" description="Previstas para os próximos 30 dias" icon={<CalendarClock />} />
              {data.upcoming.length ? (
                <ul className="divide-y divide-line">
                  {data.upcoming.map((content) => (
                    <ContentRow key={content.id} content={content} />
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="Nenhuma publicação prevista" description="Agende conteúdos no calendário editorial." />
              )}
            </Card>

            <Card>
              <CardHeader title="Atividade recente" icon={<History />} />
              {data.activity.length ? (
                <ul className="divide-y divide-line">
                  {data.activity.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-linear-to-br from-roxo to-neon" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{log.description}</p>
                        <p className="text-xs text-subtle">{formatRelative(log.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="Sem atividade ainda" description="As ações no sistema aparecerão aqui." />
              )}
            </Card>
          </div>
        </div>
      ) : null}

      <TaskFormModal
        open={!!editingTask}
        task={editingTask ?? undefined}
        onClose={() => {
          setEditingTask(null)
          reload()
        }}
        onSaved={() => {
          setEditingTask(null)
          reload()
        }}
      />
    </>
  )
}
