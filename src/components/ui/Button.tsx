import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
}

type ButtonProps = ComponentProps<'button'> & StyleProps & { loading?: boolean }

export function Button({ variant, size, loading, disabled, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...props}>
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

/** Mesmo visual do Button, mas navega para outra rota. */
export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
