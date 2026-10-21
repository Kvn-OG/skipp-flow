import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/errors'
import { clientSchema, type ClientFormInput, type ClientFormOutput } from '../../schemas/client'
import { createClient, updateClient } from '../../services/clients'
import type { Client } from '../../types/domain'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Form'
import { Modal } from '../ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
  client?: Client
  onSaved: (client: Client) => void
}

export function ClientFormModal({ open, onClose, client, onSaved }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={client ? 'Editar cliente' : 'Novo cliente'}
      description="Os conteúdos deste cliente serão produzidos para o Instagram dele."
    >
      <ClientForm client={client} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  )
}

function ClientForm({ client, onCancel, onSaved }: { client?: Client; onCancel: () => void; onSaved: (c: Client) => void }) {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput, unknown, ClientFormOutput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      contact_name: client?.contact_name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      instagram_username: client?.instagram_username ?? '',
      instagram_url: client?.instagram_url ?? '',
      description: client?.description ?? '',
      internal_notes: client?.internal_notes ?? '',
    },
  })

  // handleSubmit só chama esta função se o Zod aprovar os dados.
  async function onSubmit(values: ClientFormOutput) {
    // Se só o @ foi informado, monta o link do perfil automaticamente
    const payload = {
      ...values,
      instagram_url:
        values.instagram_url ?? (values.instagram_username ? `https://instagram.com/${values.instagram_username}` : null),
    }
    try {
      const saved = client ? await updateClient(client.id, payload) : await createClient(payload)
      toast.success(client ? 'Cliente atualizado.' : 'Cliente cadastrado.')
      onSaved(saved)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Empresa ou marca" required error={errors.name?.message} className="sm:col-span-2">
        {(id) => <Input id={id} autoFocus aria-invalid={!!errors.name} {...register('name')} />}
      </Field>
      <Field label="Contato principal" error={errors.contact_name?.message}>
        {(id) => <Input id={id} {...register('contact_name')} />}
      </Field>
      <Field label="E-mail" error={errors.email?.message}>
        {(id) => <Input id={id} type="email" aria-invalid={!!errors.email} {...register('email')} />}
      </Field>
      <Field label="Telefone" error={errors.phone?.message}>
        {(id) => <Input id={id} type="tel" placeholder="(00) 00000-0000" {...register('phone')} />}
      </Field>
      <Field label="Usuário do Instagram" error={errors.instagram_username?.message}>
        {(id) => <Input id={id} placeholder="@marca" aria-invalid={!!errors.instagram_username} {...register('instagram_username')} />}
      </Field>
      <Field
        label="Link do perfil do Instagram"
        hint="Se ficar vazio, é gerado a partir do usuário."
        error={errors.instagram_url?.message}
        className="sm:col-span-2"
      >
        {(id) => (
          <Input id={id} type="url" placeholder="https://instagram.com/marca" aria-invalid={!!errors.instagram_url} {...register('instagram_url')} />
        )}
      </Field>
      <Field label="Descrição do negócio" className="sm:col-span-2">
        {(id) => <Textarea id={id} rows={3} {...register('description')} />}
      </Field>
      <Field label="Observações internas" className="sm:col-span-2">
        {(id) => <Textarea id={id} rows={3} {...register('internal_notes')} />}
      </Field>

      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {client ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}
