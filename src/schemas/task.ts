import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES, valuesOf } from '../lib/options'
import { optionalDate, optionalId, optionalText, requiredText } from './common'

export const taskSchema = z.object({
  title: requiredText('Informe o título da tarefa'),
  description: optionalText,
  client_id: optionalId,
  project_id: optionalId,
  content_id: optionalId,
  priority: z.enum(valuesOf(TASK_PRIORITIES)),
  status: z.enum(valuesOf(TASK_STATUSES)),
  due_date: optionalDate,
})

export type TaskFormInput = z.input<typeof taskSchema>
export type TaskFormOutput = z.output<typeof taskSchema>
