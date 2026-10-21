import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginForm = z.infer<typeof loginSchema>

export const passwordSchema = z
  .object({
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'As senhas não conferem', path: ['confirm'] })

export type PasswordForm = z.infer<typeof passwordSchema>
