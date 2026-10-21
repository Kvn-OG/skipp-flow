import type { Option } from '../../lib/options'
import { cn } from '../../lib/cn'

type BadgeProps = {
  option: Option
  className?: string
  dot?: boolean
}

/** Etiqueta colorida a partir de uma opção (status, formato, prioridade...). */
export function Badge({ option, className, dot = true }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', className)}
      // Cor + sufixo hexadecimal de transparência (1f ≈ 12%, 40 ≈ 25%)
      style={{ color: option.color, backgroundColor: `${option.color}1f`, borderColor: `${option.color}40` }}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: option.color }} />}
      {option.label}
    </span>
  )
}
