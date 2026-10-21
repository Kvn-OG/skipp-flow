import { Archive, ArchiveRestore, ListChecks, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskRow } from '../components/tasks/TaskRow'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { OptionSelect, RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { daysUntil } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { PRIORITY_WEIGHT, TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from '../lib/options'
import { listClientOptions } from '../services/clients'
import { archiveTask, listTasks, restoreTask, setTaskStatus } from '../services/tasks'
import type { TaskWithRelations } from '../types/domain'

const STATUS_FILTERS = [
  { value: 'open', label: 'Abertas', color: '' },
  ...TASK_STATUSES,
] as const

type StatusFilter = TaskStatus | 'open' | ''

/** Agrupa as tarefas abertas por urgência do prazo. */
function groupOf(task: TaskWithRelations): string {
  if (task.status === 'completed') return 'Concluídas'
  if (!task.due_date) return 'Sem prazo'
  const days = daysUntil(task.due_date)
  if (days < 0) return 'Atrasadas'
  if (days === 0) return 'Hoje'
  if (days <= 7) return 'Próximos 7 dias'
  return 'Mais tarde'
}
const GROUP_ORDER = ['Atrasadas', 'Hoje', 'Próximos 7 dias', 'Mais tarde', 'Sem prazo', 'Concluídas']

export function TasksPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [clientId, setClientId] = useState('')
  const [archived, setArchived] = useState(false)
  const [editing, setEditing] = useState<TaskWithRelations | null>(null)
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const clients = useAsync(listClientOptions, [])
  const { data, loading, error, reload, setData } = useAsync(
    () =>
      listTasks({
        search: debouncedSearch,
        status: status || undefined,
        priority: priority || undefined,
        clientId: clientId || undefined,
        archived,
      }),
    [debouncedSearch, status, priority, clientId, archived],
  )

  const groups = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>()
    for (const task of data ?? []) {
      const key = groupOf(task)
      map.set(key, [...(map.get(key) ?? []), task])
    }
    // Dentro de cada grupo: prioridade mais alta primeiro
    for (const list of map.values()) {
      list.sort((a, b) => PRIORITY_WEIGHT[a.priority as TaskPriority] - PRIORITY_WEIGHT[b.priority as TaskPriority])
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const)
  }, [data])

  async function toggle(task: TaskWithRelations) {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    setData((list) => list?.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      await setTaskStatus(task.id, next)
      if (next === 'completed') toast.success('Tarefa concluída.')
    } catch (err) {
      toast.error(errorMessage(err))
      reload()
    }
  }

  async function toggleArchive(task: TaskWithRelations) {
    try {
      await (task.archived_at ? restoreTask(task.id) : archiveTask(task.id))
      toast.success(task.archived_at ? 'Tarefa restaurada.' : 'Tarefa arquivada.')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const close = () => {
    setEditing(null)
    setCreating(false)
    reload()
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        description="Tudo o que precisa ser feito, organizado por prazo e prioridade."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nova tarefa
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar tarefas" className="sm:col-span-2 lg:col-span-1" />
        <OptionSelect aria-label="Status" options={STATUS_FILTERS} emptyLabel="Todos os status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} />
        <OptionSelect
          aria-label="Prioridade"
          options={TASK_PRIORITIES}
          emptyLabel="Todas as prioridades"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
        />
        <RefSelect aria-label="Cliente" items={clients.data} emptyLabel="Todos os clientes" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <button
          type="button"
          aria-pressed={archived}
          onClick={() => setArchived((v) => !v)}
          className={cn(
            'h-10 rounded-xl border px-3 text-sm whitespace-nowrap transition-colors',
            archived ? 'border-pink/60 bg-pink/15' : 'border-line-strong text-muted hover:text-heading',
          )}
        >
          Arquivadas
        </button>
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : groups.length ? (
        <div className="flex flex-col gap-6">
          {groups.map(([group, tasks]) => (
            <Card key={group}>
              <h2 className={cn('border-b border-line px-5 py-3 text-sm font-semibold', group === 'Atrasadas' && 'text-red-300')}>
                {group} <span className="font-normal text-subtle">· {tasks.length}</span>
              </h2>
              <ul className="divide-y divide-line">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggle(task)}
                    onOpen={() => setEditing(task)}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={task.archived_at ? 'Restaurar tarefa' : 'Arquivar tarefa'}
                        title={task.archived_at ? 'Restaurar' : 'Arquivar'}
                        onClick={() => toggleArchive(task)}
                      >
                        {task.archived_at ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                      </Button>
                    }
                  />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<ListChecks />}
            title={archived ? 'Nenhuma tarefa arquivada' : 'Nenhuma tarefa por aqui'}
            description="Ajuste os filtros ou crie uma nova tarefa."
          />
        </Card>
      )}

      <TaskFormModal open={creating || !!editing} task={editing ?? undefined} onClose={close} onSaved={close} />
    </>
  )
}
