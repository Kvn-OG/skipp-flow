import { supabase } from '../lib/supabase'
import type { ProjectStatus } from '../lib/options'
import type { TablesInsert, TablesUpdate } from '../types/database'
import type { ProjectWithClient, Ref } from '../types/domain'

// "client:clients!fk(...)" busca o cliente junto com o projeto numa
// única requisição (o PostgREST faz o JOIN pela chave estrangeira).
const PROJECT_SELECT = '*, client:clients!projects_client_id_fkey(id, name)'

export type ProjectFilters = {
  search?: string
  clientId?: string
  status?: ProjectStatus
}

export async function listProjects(filters: ProjectFilters = {}): Promise<ProjectWithClient[]> {
  let query = supabase.from('projects').select(PROJECT_SELECT).order('created_at', { ascending: false })

  if (filters.clientId) query = query.eq('client_id', filters.clientId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) query = query.ilike('name', `%${filters.search.trim()}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Projetos para preencher selects (opcionalmente de um cliente só). */
export async function listProjectOptions(clientId?: string): Promise<(Ref & { client_id: string })[]> {
  let query = supabase.from('projects').select('id, name, client_id').order('name')
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProject(id: string): Promise<ProjectWithClient> {
  const { data, error } = await supabase.from('projects').select(PROJECT_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function createProject(values: TablesInsert<'projects'>) {
  const { data, error } = await supabase.from('projects').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateProject(id: string, values: TablesUpdate<'projects'>) {
  const { data, error } = await supabase.from('projects').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Conteúdos e tarefas do projeto continuam existindo, só perdem o vínculo. */
export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
