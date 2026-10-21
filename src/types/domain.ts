import type { Tables } from './database'

export type Client = Tables<'clients'>
export type Project = Tables<'projects'>
export type Content = Tables<'contents'>
export type ContentAsset = Tables<'content_assets'>
export type Task = Tables<'tasks'>
export type ChecklistItem = Tables<'task_checklist_items'>
export type ActivityLog = Tables<'activity_logs'>

/** Referência curta usada em listas (id + nome). */
export type Ref = { id: string; name: string }
export type TitleRef = { id: string; title: string }

export type ProjectWithClient = Project & { client: Ref | null }

export type ContentWithRelations = Content & {
  client: Ref | null
  project: Ref | null
}

export type TaskWithRelations = Task & {
  client: Ref | null
  project: Ref | null
  content: TitleRef | null
  checklist: Pick<ChecklistItem, 'id' | 'is_completed'>[]
}
