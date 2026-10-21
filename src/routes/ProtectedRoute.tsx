import { ShieldAlert } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/States'
import { useAuth } from '../hooks/useAuth'

/**
 * Porteiro das rotas internas:
 * - ainda verificando a sessão → tela de carregamento
 * - sem login → manda para /login (lembrando de onde veio)
 * - logado, mas fora da tabela admins → acesso negado
 *
 * Importante: isso só melhora a experiência. Quem protege os DADOS de
 * verdade são as políticas RLS no banco.
 */
export function ProtectedRoute() {
  const { session, isAdmin, loading, user, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Verificando sessão..." className="min-h-screen" />

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-10 text-neon" />
        <h1 className="text-xl font-bold">Acesso não autorizado</h1>
        <p className="max-w-md text-sm text-muted">
          A conta <strong className="text-heading">{user?.email}</strong> entrou com sucesso, mas não está liberada como
          administradora do SKIPP Flow.
        </p>
        <Button variant="secondary" onClick={() => signOut()}>
          Sair
        </Button>
      </div>
    )
  }

  return <Outlet />
}
