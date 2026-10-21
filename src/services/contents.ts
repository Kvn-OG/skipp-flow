import { todayISO } from '../lib/dates'
import { DONE_STATUSES, type ContentFormat, type ContentType, type ProductionStatus } from '../lib/options'
import { supabase } from '../lib/supabase'
import type { TablesInsert, TablesUpdate } from '../types/database'
import type { ContentWithRelations } from '../types/domain'

const CONTENT_SELECT =
  '*, client:clients!contents_client_id_fkey(id, name), project:projects!contents_project_same_client_fk(id, name)'

export type ContentFilters = {
  search?: string
  clientId?: string
  projectId?: string
  format?: ContentFormat
  contentType?: ContentType
  status?: ProductionStatus
  archived?: boolean
  /** Intervalo da data prevista de publicação (AAAA-MM-DD). */
  scheduledFrom?: string
  scheduledTo?: string
  /** Só não concluídos com prazo de produção ou publicação já vencidos. */
  overdue?: boolean
}

export async function listContents(filters: ContentFilters = {}): Promise<ContentWithRelations[]> {
  let query = supabase
    .from('contents')
    .select(CONTENT_SELECT)
    .order('scheduled_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  query = filters.archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  if (filters.clientId) query = query.eq('client_id', filters.clientId)
  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.format) query = query.eq('format', filters.format)
  if (filters.contentType) query = query.eq('content_type', filters.contentType)
  if (filters.status) query = query.eq('production_status', filters.status)
  if (filters.scheduledFrom) query = query.gte('scheduled_date', filters.scheduledFrom)
  if (filters.scheduledTo) query = query.lte('scheduled_date', filters.scheduledTo)
  if (filters.overdue) {
    const today = todayISO()
    query = query
      .not('production_status', 'in', `(${DONE_STATUSES.join(',')})`)
      .or(`production_due_date.lt.${today},scheduled_date.lt.${today}`)
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    // .or() só pode ser usado uma vez por consulta; com "overdue" ativo a
    // pesquisa fica só no título.
    query = filters.overdue
      ? query.ilike('title', term)
      : query.or(`title.ilike.${term},editorial_pillar.ilike.${term},caption.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Conteúdos não arquivados de um cliente, para preencher selects. */
export async function listContentOptions(clientId: string) {
  const { data, error } = await supabase
    .from('contents')
    .select('id, title, project_id')
    .eq('client_id', clientId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getContent(id: string): Promise<ContentWithRelations> {
  const { data, error } = await supabase.from('contents').select(CONTENT_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function createContent(values: TablesInsert<'contents'>) {
  const { data, error } = await supabase.from('contents').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateContent(id: string, values: TablesUpdate<'contents'>) {
  const { data, error } = await supabase.from('contents').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

export function updateContentStatus(id: string, status: ProductionStatus) {
  return updateContent(id, { production_status: status })
}

export function updateContentSchedule(id: string, scheduledDate: string | null) {
  return updateContent(id, { scheduled_date: scheduledDate })
}

export function archiveContent(id: string) {
  return updateContent(id, { archived_at: new Date().toISOString() })
}

export function restoreContent(id: string) {
  return updateContent(id, { archived_at: null })
}

/**
 * Cria uma cópia editável: mesmo cliente, projeto e textos, mas volta para
 * "Ideia" e sem datas, porque a cópia é um novo conteúdo a produzir.
 */
export async function duplicateContent(id: string) {
  const { data: original, error } = await supabase.from('contents').select('*').eq('id', id).single()
  if (error) throw error

  return createContent({
    client_id: original.client_id,
    project_id: original.project_id,
    title: `${original.title} (cópia)`,
    format: original.format,
    content_type: original.content_type,
    editorial_pillar: original.editorial_pillar,
    briefing: original.briefing,
    objective: original.objective,
    script: original.script,
    caption: original.caption,
    call_to_action: original.call_to_action,
    internal_notes: original.internal_notes,
    production_status: 'idea',
  })
}
