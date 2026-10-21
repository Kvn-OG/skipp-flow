import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from './navigation'

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-roxo/20 text-heading' : 'text-muted hover:bg-white/5 hover:text-heading',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Barrinha em gradiente indicando a página atual */}
          <span
            aria-hidden
            className={cn(
              'absolute top-2 bottom-2 left-0 w-1 rounded-full bg-linear-to-b from-roxo to-neon transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-neon' : 'text-subtle group-hover:text-muted')} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col bg-night">
      <div className="flex h-16 items-center gap-2 px-5">
        <img src="/assets/skipp-logo-footer.webp" alt="SKIPP" width={397} height={69} className="h-6 w-auto" />
        <span className="rounded-md bg-brand px-1.5 py-0.5 font-title text-[11px] font-bold tracking-wide uppercase">Flow</span>
      </div>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-line px-3 py-4">
        <NavEntry item={SETTINGS_ITEM} onNavigate={onNavigate} />
        <div className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold uppercase">
            {user?.email?.[0] ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.email}</p>
            <p className="text-[11px] text-subtle">Administrador</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Sair"
            title="Sair"
            className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-white/5 hover:text-heading"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
