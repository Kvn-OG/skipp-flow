import {
  CalendarDays,
  Clapperboard,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/conteudos', label: 'Conteúdos', icon: Clapperboard },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/tarefas', label: 'Tarefas', icon: ListChecks },
]

export const SETTINGS_ITEM: NavItem = { to: '/configuracoes', label: 'Configurações', icon: Settings }
