import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/errors'
import { PROJECT_STATUSES } from '../../lib/options'
import { projectSchema, type ProjectFormInput, type ProjectFormOutput } from '../../schemas/project'
import { listClientOptions } from '../../services/clients'
import { createProject, updateProject } from '../../services/projects'
import type { Project, ProjectWithClient } from '../../types/domain'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { OptionSelect, RefSelect } from '../ui/OptionSelect'

type Props = {
  open: boolean
  onClose: () => void
  project?: ProjectWithClient
  /** Já abre com este cliente selecionado (ex.: a partir da página do cliente). */
  defaultClientId?: string
  onSaved: (project: Project) => void
}

export function ProjectFormModal({ open, onClose, project, defaultClientId, onSaved }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={project ? 'Editar projeto' : 'Novo projeto'}>
      <ProjectForm project={project} defaultClientId={defaultClientId} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  )
}

function ProjectForm({
  project,
  defaultClientId,
  onCancel,
  onSaved,
}: Omit<Props, 'open' | 'onClose'> & { onCancel: () => void }) {
  const toast = useToast()
  const clients = useAsync(listClientOptions, [])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? '',
      client_id: project?.client_id ?? defaultClientId ?? '',
      description: project?.description ?? '',
      status: (project?.status as ProjectFormInput['status']) ?? 'planning',
      start_date: project?.start_date ?? '',
      end_date: project?.end_date ?? '',
      internal_notes: project?.internal_notes ?? '',
    },
  })

  async function onSubmit(values: ProjectFormOutput) {
    try {
      const saved = project ? await updateProject(project.id, values) : await createProject(values)
      toast.success(project ? 'Projeto atualizado.' : 'Projeto criado.')
      onSaved(saved)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome do projeto" required error={errors.name?.message} className="sm:col-span-2">
        {(id) => <Input id={id} autoFocus aria-invalid={!!errors.name} {...register('name')} />}
      </Field>
      {project ? (
        // O cliente de um projeto existente não muda: os conteúdos dele
        // estão presos a esse cliente pela chave estrangeira composta.
        <Field label="Cliente" hint="O cliente de um projeto existente não pode ser trocado.">
          {(id) => (
            <>
              <Input id={id} value={project.client?.name ?? ''} disabled />
              <input type="hidden" {...register('client_id')} />
            </>
          )}
        </Field>
      ) : (
        <Field label="Cliente" required error={errors.client_id?.message}>
          {(id) => (
            <RefSelect
              id={id}
              items={clients.data}
              emptyLabel="Selecione..."
              aria-invalid={!!errors.client_id}
              {...register('client_id')}
            />
          )}
        </Field>
      )}
      <Field label="Status">{(id) => <OptionSelect id={id} options={PROJECT_STATUSES} {...register('status')} />}</Field>
      <Field label="Data de início" error={errors.start_date?.message}>
        {(id) => <Input id={id} type="date" {...register('start_date')} />}
      </Field>
      <Field label="Data de término (opcional)" error={errors.end_date?.message}>
        {(id) => <Input id={id} type="date" aria-invalid={!!errors.end_date} {...register('end_date')} />}
      </Field>
      <Field label="Descrição" className="sm:col-span-2">
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
          {project ? 'Salvar alterações' : 'Criar projeto'}
        </Button>
      </div>
    </form>
  )
}
