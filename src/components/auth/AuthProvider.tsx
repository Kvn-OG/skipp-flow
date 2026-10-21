import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from '../../lib/contexts'
import { supabase } from '../../lib/supabase'

async function checkAdmin(userId: string): Promise<boolean> {
  // A política RLS de "admins" só deixa cada usuário ver a própria linha.
  // Se ela vier, o usuário é administrador.
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  return !!data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function apply(next: Session | null) {
      const admin = next ? await checkAdmin(next.user.id) : false
      if (!active) return
      setSession(next)
      setIsAdmin(admin)
      setLoading(false)
    }

    // 1) Sessão salva no navegador (usuário que já tinha feito login)
    supabase.auth.getSession().then(({ data }) => apply(data.session))

    // 2) Mudanças futuras: login, logout, renovação do token.
    // A consulta ao banco é adiada com setTimeout porque o Supabase
    // recomenda não chamar a API dentro deste callback.
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'INITIAL_SESSION') return
      setTimeout(() => apply(next), 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, loading, isAdmin, signIn, signOut }),
    [session, loading, isAdmin, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
