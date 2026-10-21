// Valores aceitos pelo banco (check constraints) com rótulo e cor para a
// interface. Se mudar uma lista aqui, a migration correspondente também
// precisa mudar.

export type Option<V extends string = string> = {
  value: V
  label: string
  color: string
}

export const CLIENT_STATUSES = [
  { value: 'active', label: 'Ativo', color: '#22C55E' },
  { value: 'archived', label: 'Arquivado', color: '#8B7A90' },
] as const satisfies readonly Option[]

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planejamento', color: '#A78BFA' },
  { value: 'active', label: 'Ativo', color: '#22C55E' },
  { value: 'paused', label: 'Pausado', color: '#F59E0B' },
  { value: 'completed', label: 'Concluído', color: '#8B7A90' },
] as const satisfies readonly Option[]

export const CONTENT_FORMATS = [
  { value: 'reels', label: 'Reels', color: '#FA15E5' },
  { value: 'static_post', label: 'Post estático', color: '#A78BFA' },
  { value: 'carousel', label: 'Carrossel', color: '#38BDF8' },
  { value: 'stories', label: 'Stories', color: '#F59E0B' },
  { value: 'other', label: 'Outro formato', color: '#8B7A90' },
] as const satisfies readonly Option[]

export const CONTENT_TYPES = [
  { value: 'educational', label: 'Educativo', color: '#38BDF8' },
  { value: 'institutional', label: 'Institucional', color: '#A78BFA' },
  { value: 'commercial', label: 'Comercial', color: '#22C55E' },
  { value: 'authority', label: 'Autoridade', color: '#C50097' },
  { value: 'behind_the_scenes', label: 'Bastidores', color: '#F59E0B' },
  { value: 'social_proof', label: 'Prova social', color: '#14B8A6' },
  { value: 'entertainment', label: 'Entretenimento', color: '#FA15E5' },
  { value: 'commemorative', label: 'Datas comemorativas', color: '#F97316' },
  { value: 'other', label: 'Outro', color: '#8B7A90' },
] as const satisfies readonly Option[]

// A ordem desta lista é a ordem das colunas do Kanban.
export const PRODUCTION_STATUSES = [
  { value: 'idea', label: 'Ideia', color: '#8B7A90' },
  { value: 'planning', label: 'Planejamento', color: '#A78BFA' },
  { value: 'script', label: 'Roteiro', color: '#818CF8' },
  { value: 'awaiting_recording', label: 'Aguardando gravação', color: '#38BDF8' },
  { value: 'recording', label: 'Gravação', color: '#14B8A6' },
  { value: 'editing', label: 'Edição', color: '#F59E0B' },
  { value: 'internal_review', label: 'Revisão interna', color: '#F97316' },
  { value: 'adjustments', label: 'Ajustes', color: '#EF4444' },
  { value: 'finished', label: 'Finalizado', color: '#22C55E' },
  { value: 'published', label: 'Publicado', color: '#FA15E5' },
] as const satisfies readonly Option[]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Baixa', color: '#8B7A90' },
  { value: 'medium', label: 'Média', color: '#38BDF8' },
  { value: 'high', label: 'Alta', color: '#F59E0B' },
  { value: 'urgent', label: 'Urgente', color: '#EF4444' },
] as const satisfies readonly Option[]

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pendente', color: '#A78BFA' },
  { value: 'in_progress', label: 'Em andamento', color: '#F59E0B' },
  { value: 'completed', label: 'Concluída', color: '#22C55E' },
] as const satisfies readonly Option[]

export const ASSET_KINDS = [
  { value: 'raw_video', label: 'Vídeo bruto', color: '#38BDF8' },
  { value: 'final_video', label: 'Vídeo finalizado', color: '#22C55E' },
  { value: 'art', label: 'Arte', color: '#FA15E5' },
  { value: 'reference', label: 'Referência', color: '#A78BFA' },
  { value: 'document', label: 'Documento', color: '#F59E0B' },
  { value: 'drive_folder', label: 'Pasta no Google Drive', color: '#14B8A6' },
  { value: 'other', label: 'Outro', color: '#8B7A90' },
] as const satisfies readonly Option[]

type ValueOf<L extends readonly Option[]> = L[number]['value']

export type ClientStatus = ValueOf<typeof CLIENT_STATUSES>
export type ProjectStatus = ValueOf<typeof PROJECT_STATUSES>
export type ContentFormat = ValueOf<typeof CONTENT_FORMATS>
export type ContentType = ValueOf<typeof CONTENT_TYPES>
export type ProductionStatus = ValueOf<typeof PRODUCTION_STATUSES>
export type TaskPriority = ValueOf<typeof TASK_PRIORITIES>
export type TaskStatus = ValueOf<typeof TASK_STATUSES>
export type AssetKind = ValueOf<typeof ASSET_KINDS>

/** Lista de valores para usar em z.enum(). */
export function valuesOf<L extends readonly Option[]>(list: L) {
  return list.map((o) => o.value) as [ValueOf<L>, ...ValueOf<L>[]]
}

/** Encontra a opção de um valor; cai num item neutro se não existir. */
export function findOption(list: readonly Option[], value: string | null | undefined): Option {
  return list.find((o) => o.value === value) ?? { value: value ?? '', label: value ?? '—', color: '#8B7A90' }
}

// Agrupamentos usados pelo dashboard e pelos filtros.
export const NOT_STARTED_STATUSES: ProductionStatus[] = ['idea', 'planning']
export const IN_PRODUCTION_STATUSES: ProductionStatus[] = [
  'script',
  'awaiting_recording',
  'recording',
  'editing',
  'internal_review',
  'adjustments',
]
export const DONE_STATUSES: ProductionStatus[] = ['finished', 'published']

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
