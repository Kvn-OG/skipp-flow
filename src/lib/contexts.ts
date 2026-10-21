import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

// Os contextos ficam separados dos componentes Provider para que o Vite
// consiga atualizar os componentes sem recarregar a página (Fast Refresh).

export type AuthState = {
  session: Session | null
  user: User | null
  /** Ainda verificando se existe sessão salva. */
  loading: boolean
  /** O usuário logado está na tabela admins. */
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export type ToastTone = 'success' | 'error' | 'info'

export type ToastApi = {
  show: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
