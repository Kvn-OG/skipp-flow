import { AlertTriangle, RotateCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '../components/ui/Button'

/** Mostrado quando uma página quebra (erro inesperado) em vez de uma tela branca. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="size-10 text-red-300" />
      <h1 className="text-xl font-bold">Algo deu errado nesta página</h1>
      <p className="max-w-md text-sm text-muted">{message}</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        <RotateCw className="size-4" /> Recarregar
      </Button>
    </div>
  )
}
