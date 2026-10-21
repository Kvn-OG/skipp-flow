import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-2xl border border-line bg-surface', className)} {...props} />
}

type CardHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function CardHeader({ title, description, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-roxo/20 text-neon [&>svg]:size-4">{icon}</span>
        )}
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
