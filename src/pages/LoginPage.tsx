import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Form'
import { useAuth } from '../hooks/useAuth'
import { errorMessage } from '../lib/errors'
import { loginSchema, type LoginForm } from '../schemas/auth'

export function LoginPage() {
  const { session, signIn, loading } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  // Já logado: volta para onde estava (ou para o dashboard)
  if (!loading && session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function onSubmit({ email, password }: LoginForm) {
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Brilho e seta 3D decorativos da marca */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-roxo/30 blur-[120px]" />
      <img
        aria-hidden
        src="/assets/seta-3d.webp"
        alt=""
        width={781}
        height={521}
        className="pointer-events-none absolute -right-24 -bottom-16 w-[28rem] max-w-none rotate-[-12deg] opacity-25 sm:opacity-40"
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <img src="/assets/skipp-logo-footer.webp" alt="SKIPP" width={397} height={69} className="h-8 w-auto" />
            <span className="rounded-md bg-brand px-2 py-0.5 font-title text-xs font-bold tracking-wide uppercase">Flow</span>
          </div>
          <p className="text-sm text-muted">Gestão da produção de conteúdo da SKIPP Marketing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass-card flex flex-col gap-4 rounded-3xl p-6 sm:p-8">
          <h1 className="text-xl font-bold">Entrar</h1>

          <Field label="E-mail" error={errors.email?.message}>
            {(id) => <Input id={id} type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} {...register('email')} />}
          </Field>
          <Field label="Senha" error={errors.password?.message}>
            {(id) => (
              <Input id={id} type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
            )}
          </Field>

          {error && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="mt-2 h-11">
            <LogIn className="size-4" /> Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-subtle">Acesso restrito. Contas são criadas pelo administrador.</p>
      </div>
    </div>
  )
}
