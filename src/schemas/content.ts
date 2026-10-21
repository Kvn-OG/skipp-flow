import { z } from 'zod'
import { ASSET_KINDS, CONTENT_FORMATS, CONTENT_TYPES, PRODUCTION_STATUSES, valuesOf } from '../lib/options'
import { optionalDate, optionalId, optionalText, optionalUrl, requiredText } from './common'

export const contentSchema = z.object({
  title: requiredText('Informe o título do conteúdo'),
  client_id: requiredText('Selecione o cliente'),
  project_id: optionalId,
  format: z.enum(valuesOf(CONTENT_FORMATS)),
  content_type: z.enum(valuesOf(CONTENT_TYPES)),
  editorial_pillar: optionalText,
  briefing: optionalText,
  objective: optionalText,
  script: optionalText,
  caption: optionalText,
  call_to_action: optionalText,
  production_status: z.enum(valuesOf(PRODUCTION_STATUSES)),
  production_due_date: optionalDate,
  scheduled_date: optionalDate,
  final_asset_url: optionalUrl,
  internal_notes: optionalText,
})

export type ContentFormInput = z.input<typeof contentSchema>
export type ContentFormOutput = z.output<typeof contentSchema>

export const assetSchema = z.object({
  name: requiredText('Dê um nome ao arquivo'),
  url: z
    .string()
    .trim()
    .min(1, 'Cole o link do arquivo')
    .regex(/^https?:\/\/\S+$/i, 'Informe um link começando com http:// ou https://'),
  kind: z.enum(valuesOf(ASSET_KINDS)),
  description: optionalText,
})

export type AssetFormInput = z.input<typeof assetSchema>
export type AssetFormOutput = z.output<typeof assetSchema>
