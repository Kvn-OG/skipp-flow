import { Menu, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ButtonLink } from '../ui/Button'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Volta ao topo ao trocar de página
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Menu do celular aberto: Esc fecha e a página de trás não rola
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop: menu fixo à esquerda */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line lg:block">
        <Sidebar />
      </aside>

      {/* Celular/tablet: menu em gaveta */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85%] animate-slide-in border-r border-line shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-4 right-3 z-10 rounded-lg p-1.5 text-muted hover:bg-white/5"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="-ml-1.5 rounded-lg p-1.5 text-muted hover:bg-white/5 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <img src="/assets/skipp-logo-footer.webp" alt="SKIPP Flow" width={397} height={69} className="h-5 w-auto lg:hidden" />
        </div>
        <ButtonLink to="/conteudos/novo" size="sm">
          <Plus className="size-4" /> Novo conteúdo
        </ButtonLink>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
