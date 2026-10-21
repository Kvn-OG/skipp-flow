import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-[background-color,box-shadow,color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-[0_6px_20px_rgb(150_0_134/0.25)] hover:shadow-[0_8px_28px_rgb(197_0_151/0.45)]',
  secondary: 'border border-line-strong bg-surface-2 text-heading hover:bg-surface-3',
  ghost: 'text-muted hover:bg-white/5 hover:text-heading',
  danger: 'border border-danger/40 bg-danger/10 text-red-300 hover:bg-danger/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  icon: 'size-9',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}
