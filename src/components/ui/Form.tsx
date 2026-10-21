import { ChevronDown } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

const control =
  'w-full rounded-xl border border-line-strong bg-night/60 px-3.5 text-sm text-heading placeholder:text-subtle transition-colors outline-none focus:border-pink focus:ring-2 focus:ring-pink/25 aria-invalid:border-danger/70 disabled:opacity-60'

type FieldProps = {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  /** Recebe o id gerado para ligar <label> ao campo (acessibilidade). */
  children: (id: string) => ReactNode
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
        {required && <span className="ml-0.5 text-neon">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(control, 'resize-y py-2.5 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-10 cursor-pointer appearance-none pr-9 [&>option]:bg-surface', className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
    </div>
  )
}

/** Seção de formulário com título, usada em formulários longos. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
