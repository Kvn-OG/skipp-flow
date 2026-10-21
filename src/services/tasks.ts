import { supabase } from '../lib/supabase'
import type { TaskPriority, TaskStatus } from '../lib/options'
import type { TablesInsert, TablesUpdate } from '../types/database'
import type { ChecklistItem, TaskWithRelations } from '../types/domain'

const TASK_SELECT = [
  '*',
  'client:clients!tasks_client_id_fkey(id, name)',
  'project:projects!tasks_project_same_client_fk(id, name)',
  'content:contents!tasks_content_same_client_fk(id, title)',
  'checklist:task_checklist_items(id, is_completed)',
].join(', ')

export type TaskFilters = {
  search?: string
  status?: TaskStatus | 'open'
  priority?: TaskPriority
  clientId?: string
  projectId?: string
  contentId?: string
  archived?: boolean
  dueUntil?: string
}

export async function listTasks(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
  let query = supabase
    .from('tasks')
    .select(TASK_SELECT)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  query = filters.archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  if (filters.status === 'open') query = query.neq('status', 'completed')
  else if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.clientId) query = query.eq('client_id', filters.clientId)
  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.contentId) query = query.eq('content_id', filters.contentId)
  if (filters.dueUntil) query = query.lte('due_date', filters.dueUntil)
  if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`)

  const { data, error } = await query.overrideTypes<TaskWithRelations[], { merge: false }>()
  if (error) throw error
  return data
}

export async function createTask(values: TablesInsert<'tasks'>) {
  const { data, error } = await supabase.from('tasks').insert(values).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, values: TablesUpdate<'tasks'>) {
  const { data, error } = await supabase.from('tasks').update(values).eq('id', id).select().single()
  if (error) throw error
  return data
}

export function setTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status })
}

export function archiveTask(id: string) {
  return updateTask(id, { archived_at: new Date().toISOString() })
}

export function restoreTask(id: string) {
  return updateTask(id, { archived_at: null })
}

// ---- Checklist ------------------------------------------------------

export async function listChecklist(taskId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .select('*')
    .eq('task_id', taskId)
    .order('position')
    .order('created_at')
  if (error) throw error
  return data
}

export async function addChecklistItem(taskId: string, title: string, position: number) {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .insert({ task_id: taskId, title, position })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleChecklistItem(id: string, isCompleted: boolean) {
  const { error } = await supabase.from('task_checklist_items').update({ is_completed: isCompleted }).eq('id', id)
  if (error) throw error
}

export async function deleteChecklistItem(id: string) {
  const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
  if (error) throw error
}
