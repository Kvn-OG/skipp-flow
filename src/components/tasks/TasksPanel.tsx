import { ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/errors'
import { listTasks, setTaskStatus, type TaskFilters } from '../../services/tasks'
import type { TaskWithRelations } from '../../types/domain'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../ui/States'
import { TaskFormModal, type TaskDefaults } from './TaskFormModal'
import { TaskRow } from './TaskRow'

type TasksPanelProps = {
  filters: TaskFilters
  defaults: TaskDefaults
  title?: string
}

/** Tarefas ligadas a um cliente, projeto ou conteúdo (usado nas páginas de detalhe). */
export function TasksPanel({ filters, defaults, title = 'Tarefas' }: TasksPanelProps) {
  const toast = useToast()
  const key = JSON.stringify(filters)
  const { data, loading, error, reload, setData } = useAsync(() => listTasks(filters), [key])
  const [editing, setEditing] = useState<TaskWithRelations | null>(null)
  const [creating, setCreating] = useState(false)

  async function toggle(task: TaskWithRelations) {
    const status = task.status === 'completed' ? 'pending' : 'completed'
    setData((list) => list?.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await setTaskStatus(task.id, status)
    } catch (err) {
      toast.error(errorMessage(err))
      reload()
    }
  }

  const close = () => {
    setEditing(null)
    setCreating(false)
    reload()
  }

  return (
    <Card>
      <CardHeader
        title={title}
        icon={<ListChecks />}
        action={
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> Nova
          </Button>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : data?.length ? (
        <ul className="divide-y divide-line">
          {data.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} onOpen={() => setEditing(task)} />
          ))}
        </ul>
      ) : (
        <EmptyState compact title="Nenhuma tarefa" description="Crie tarefas para acompanhar o que precisa ser feito." />
      )}

      <TaskFormModal open={creating || !!editing} task={editing ?? undefined} defaults={defaults} onClose={close} onSaved={close} />
    </Card>
  )
}
