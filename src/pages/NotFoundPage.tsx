import { Home } from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-brand-gradient font-title text-7xl font-bold">404</p>
      <h1 className="text-xl font-bold">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted">O endereço pode ter sido digitado errado ou o conteúdo não existe mais.</p>
      <ButtonLink to="/" variant="secondary">
        <Home className="size-4" /> Voltar ao início
      </ButtonLink>
    </div>
  )
}
