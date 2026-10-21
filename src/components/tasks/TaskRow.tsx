import { Check, ListChecks } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { describeDue, isOverdue } from '../../lib/dates'
import { TASK_PRIORITIES, TASK_STATUSES, findOption } from '../../lib/options'
import type { TaskWithRelations } from '../../types/domain'
import { Badge } from '../ui/Badge'

type TaskRowProps = {
  task: TaskWithRelations
  onToggle: () => void
  onOpen: () => void
  actions?: ReactNode
}

export function TaskRow({ task, onToggle, onOpen, actions }: TaskRowProps) {
  const done = task.status === 'completed'
  const late = !done && isOverdue(task.due_date)
  const checklistDone = task.checklist.filter((i) => i.is_completed).length
  const context = [task.client?.name, task.project?.name, task.content?.title].filter(Boolean).join(' · ')

  return (
    <li className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        onClick={onToggle}
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          done ? 'border-success bg-success text-ink' : 'border-line-strong hover:border-pink',
        )}
      >
        {done && <Check className="size-3.5" strokeWidth={3} />}
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className={cn('text-sm font-medium', done && 'text-subtle line-through')}>{task.title}</p>
        {context && <p className="truncate text-xs text-muted">{context}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge option={findOption(TASK_PRIORITIES, task.priority)} />
          {task.status === 'in_progress' && <Badge option={findOption(TASK_STATUSES, task.status)} dot={false} />}
          {task.due_date && !done && (
            <span className={cn('text-xs', late ? 'font-medium text-red-300' : 'text-muted')}>{describeDue(task.due_date)}</span>
          )}
          {task.checklist.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <ListChecks className="size-3.5" /> {checklistDone}/{task.checklist.length}
            </span>
          )}
        </div>
      </button>

      {actions}
    </li>
  )
}
