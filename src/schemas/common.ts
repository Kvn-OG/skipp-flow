import { z } from 'zod'

// Inputs HTML sempre devolvem texto ('' quando vazio). Estes helpers
// convertem '' em null, que é como o banco representa "sem valor".

export const requiredText = (message: string) => z.string().trim().min(1, message)

export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))

export const optionalDate = z
  .string()
  .transform((value) => (value === '' ? null : value))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida')

export const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), 'Informe um link começando com http:// ou https://')
  .transform((value) => (value === '' ? null : value))

export const optionalId = z.string().transform((value) => (value === '' ? null : value))
