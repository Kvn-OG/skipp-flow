import { AlertTriangle, Inbox, LoaderCircle, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

export function LoadingState({ label = 'Carregando...', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-3 py-16 text-sm text-muted', className)}>
      <LoaderCircle aria-hidden className="size-5 animate-spin text-neon" />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <AlertTriangle aria-hidden className="size-6 text-red-300" />
      <p className="max-w-md text-sm text-red-200">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Tentar novamente
        </Button>
      )}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, description, icon, action, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', compact ? 'px-4 py-8' : 'px-6 py-16')}>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-roxo/15 text-neon [&>svg]:size-6">
        {icon ?? <Inbox />}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
