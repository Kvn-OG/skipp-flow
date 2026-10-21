import { z } from 'zod'
import { PROJECT_STATUSES, valuesOf } from '../lib/options'
import { optionalDate, optionalText, requiredText } from './common'

export const projectSchema = z
  .object({
    name: requiredText('Informe o nome do projeto'),
    client_id: requiredText('Selecione o cliente'),
    description: optionalText,
    status: z.enum(valuesOf(PROJECT_STATUSES)),
    start_date: optionalDate,
    end_date: optionalDate,
    internal_notes: optionalText,
  })
  // Regra que envolve dois campos: validada depois dos campos individuais
  .refine((p) => !p.start_date || !p.end_date || p.end_date >= p.start_date, {
    message: 'O término não pode ser antes do início',
    path: ['end_date'],
  })

export type ProjectFormInput = z.input<typeof projectSchema>
export type ProjectFormOutput = z.output<typeof projectSchema>
