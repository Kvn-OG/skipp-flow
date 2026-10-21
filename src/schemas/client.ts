import { z } from 'zod'
import { optionalText, optionalUrl, requiredText } from './common'

export const clientSchema = z.object({
  name: requiredText('Informe o nome da empresa ou marca'),
  contact_name: optionalText,
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'E-mail inválido')
    .transform((v) => (v === '' ? null : v.toLowerCase())),
  phone: optionalText,
  // Aceita "@marca" ou "marca" e guarda sem o @
  instagram_username: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ''))
    .refine((v) => v === '' || /^[A-Za-z0-9._]{1,30}$/.test(v), 'Usuário do Instagram inválido')
    .transform((v) => (v === '' ? null : v)),
  instagram_url: optionalUrl,
  description: optionalText,
  internal_notes: optionalText,
})

export type ClientFormInput = z.input<typeof clientSchema>
export type ClientFormOutput = z.output<typeof clientSchema>
