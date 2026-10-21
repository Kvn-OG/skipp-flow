import { CalendarDays, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '../../lib/cn'
import { describeDue, formatShortDate, isOverdue } from '../../lib/dates'
import { CONTENT_FORMATS, DONE_STATUSES, PRODUCTION_STATUSES, findOption, type ProductionStatus } from '../../lib/options'
import type { ContentWithRelations } from '../../types/domain'
import { Badge } from '../ui/Badge'

type ContentRowProps = {
  content: ContentWithRelations
  /** Esconde o nome do cliente (quando a lista já é de um cliente só). */
  hideClient?: boolean
}

export function ContentRow({ content, hideClient }: ContentRowProps) {
  const done = DONE_STATUSES.includes(content.production_status as ProductionStatus)
  const late = !done && isOverdue(content.production_due_date)

  return (
    <li>
      <Link
        to={`/conteudos/${content.id}`}
        className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{content.title}</p>
          <p className="truncate text-xs text-muted">
            {[!hideClient && content.client?.name, content.project?.name].filter(Boolean).join(' · ') || 'Sem projeto'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge option={findOption(CONTENT_FORMATS, content.format)} dot={false} />
          <Badge option={findOption(PRODUCTION_STATUSES, content.production_status)} />
          {content.production_due_date && !done && (
            <span className={cn('inline-flex items-center gap-1 text-xs', late ? 'text-red-300' : 'text-muted')} title="Prazo de produção">
              <Clock className="size-3.5" /> {describeDue(content.production_due_date)}
            </span>
          )}
          {content.scheduled_date && (
            <span className="inline-flex items-center gap-1 text-xs text-muted" title="Publicação prevista">
              <CalendarDays className="size-3.5" /> {formatShortDate(content.scheduled_date)}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}
