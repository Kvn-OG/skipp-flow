import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Variáveis do Supabase ausentes. Copie .env.example para .env.local e preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

// Um único cliente para o app inteiro. Ele guarda a sessão do login no
// navegador e envia o token em cada requisição, e é isso que permite ao
// banco aplicar as políticas RLS.
export const supabase = createClient<Database>(url, publishableKey)
