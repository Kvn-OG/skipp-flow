import { supabase } from '../lib/supabase'
import type { ClientStatus } from '../lib/options'
import type { TablesInsert, TablesUpdate } from '../types/database'
import type { Client, Ref } from '../types/domain'

export type ClientFilters = {
  search?: string
  status?: ClientStatus
}

export async function listClients(filters: ClientFilters = {}): Promise<Client[]> {
  let query = supabase.from('clients').select('*').order('name')

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`name.ilike.${term},contact_name.ilike.${term},instagram_username.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Clientes ativos para preencher selects. */
export async function listClientOptions(): Promise<Ref[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return data
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createClient(values: TablesInsert<'clients'>): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, values: TablesUpdate<'clients'>): Promise<Client> {
  const { data, error } = await supabase.from('clients').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function setClientStatus(id: string, status: ClientStatus): Promise<Client> {
  return updateClient(id, { status })
}
