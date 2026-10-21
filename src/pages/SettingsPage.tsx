import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LogOut, SlidersHorizontal, UserCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { usePreferences, type Preferences } from '../hooks/usePreferences'
import { useToast } from '../hooks/useToast'
import { formatDate, formatRelative } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { supabase } from '../lib/supabase'
import { passwordSchema, type PasswordForm } from '../schemas/auth'

function ChangePassword() {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: { password: '', confirm: '' } })

  async function onSubmit({ password }: PasswordForm) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    reset()
    toast.success('Senha alterada.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Nova senha" error={errors.password?.message}>
        {(id) => <Input id={id} type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />}
      </Field>
      <Field label="Confirmar nova senha" error={errors.confirm?.message}>
        {(id) => <Input id={id} type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" loading={isSubmitting}>
          Alterar senha
        </Button>
      </div>
    </form>
  )
}

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { preferences, update } = usePreferences()
  const toast = useToast()

  return (
    <>
      <PageHeader title="Configurações" description="Sua conta e preferências do sistema." />

      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader title="Conta" icon={<UserCircle />} />
          <dl className="grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-subtle">E-mail</dt>
              <dd className="mt-0.5 text-sm break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Conta criada em</dt>
              <dd className="mt-0.5 text-sm">{user?.created_at ? formatDate(user.created_at) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Último acesso</dt>
              <dd className="mt-0.5 text-sm">{user?.last_sign_in_at ? formatRelative(user.last_sign_in_at) : '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Alterar senha" icon={<KeyRound />} />
          <ChangePassword />
        </Card>

        <Card>
          <CardHeader title="Preferências" description="Salvas apenas neste navegador." icon={<SlidersHorizontal />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Visualização inicial do calendário">
              {(id) => (
                <Select
                  id={id}
                  value={preferences.calendarView}
                  onChange={(e) => {
                    update({ calendarView: e.target.value as Preferences['calendarView'] })
                    toast.success('Preferência salva.')
                  }}
                >
                  <option value="dayGridMonth">Mensal</option>
                  <option value="dayGridWeek">Semanal</option>
                </Select>
              )}
            </Field>
            <Field label="Semana começa em">
              {(id) => (
                <Select
                  id={id}
                  value={preferences.weekStartsOn}
                  onChange={(e) => {
                    update({ weekStartsOn: Number(e.target.value) as Preferences['weekStartsOn'] })
                    toast.success('Preferência salva.')
                  }}
                >
                  <option value={0}>Domingo</option>
                  <option value={1}>Segunda-feira</option>
                </Select>
              )}
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Encerrar sessão</p>
            <p className="text-sm text-muted">Você precisará entrar de novo com e-mail e senha.</p>
          </div>
          <Button
            variant="danger"
            onClick={() => signOut().catch((error: unknown) => toast.error(errorMessage(error)))}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </Card>
      </div>
    </>
  )
}
