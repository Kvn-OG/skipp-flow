import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/errors'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../lib/options'
import { taskSchema, type TaskFormInput, type TaskFormOutput } from '../../schemas/task'
import { listClientOptions } from '../../services/clients'
import { listContentOptions } from '../../services/contents'
import { listProjectOptions } from '../../services/projects'
import { addChecklistItem, createTask, updateTask } from '../../services/tasks'
import type { Ref, Task, TitleRef } from '../../types/domain'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { OptionSelect, RefSelect } from '../ui/OptionSelect'
import { DraftChecklist, TaskChecklist } from './TaskChecklist'

export type TaskDefaults = {
  client_id?: string
  project_id?: string
  content_id?: string
}

type Props = {
  open: boolean
  onClose: () => void
  task?: Task & { client?: Ref | null; content?: TitleRef | null }
  defaults?: TaskDefaults
  onSaved: () => void
}

export function TaskFormModal({ open, onClose, task, defaults, onSaved }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={task ? 'Editar tarefa' : 'Nova tarefa'}>
      <TaskForm task={task} defaults={defaults} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  )
}

function TaskForm({ task, defaults, onCancel, onSaved }: Omit<Props, 'open' | 'onClose'> & { onCancel: () => void }) {
  const toast = useToast()
  const [draftItems, setDraftItems] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput, unknown, TaskFormOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      client_id: task?.client_id ?? defaults?.client_id ?? '',
      project_id: task?.project_id ?? defaults?.project_id ?? '',
      content_id: task?.content_id ?? defaults?.content_id ?? '',
      priority: (task?.priority as TaskFormInput['priority']) ?? 'medium',
      status: (task?.status as TaskFormInput['status']) ?? 'pending',
      due_date: task?.due_date ?? '',
    },
  })

  // Projeto e conteúdo dependem do cliente escolhido
  const clientId = useWatch({ control, name: 'client_id' })
  const clients = useAsync(listClientOptions, [])
  const projects = useAsync(() => (clientId ? listProjectOptions(clientId) : Promise.resolve([])), [clientId])
  const contents = useAsync(() => (clientId ? listContentOptions(clientId) : Promise.resolve([])), [clientId])

  async function onSubmit(values: TaskFormOutput) {
    try {
      if (task) {
        await updateTask(task.id, values)
      } else {
        const created = await createTask(values)
        for (const [index, title] of draftItems.entries()) {
          await addChecklistItem(created.id, title, index)
        }
      }
      toast.success(task ? 'Tarefa atualizada.' : 'Tarefa criada.')
      onSaved()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Título" required error={errors.title?.message} className="sm:col-span-2">
        {(id) => <Input id={id} autoFocus aria-invalid={!!errors.title} {...register('title')} />}
      </Field>
      <Field label="Descrição" className="sm:col-span-2">
        {(id) => <Textarea id={id} rows={3} {...register('description')} />}
      </Field>

      <Field label="Prioridade">{(id) => <OptionSelect id={id} options={TASK_PRIORITIES} {...register('priority')} />}</Field>
      <Field label="Status">{(id) => <OptionSelect id={id} options={TASK_STATUSES} {...register('status')} />}</Field>
      <Field label="Prazo" error={errors.due_date?.message}>
        {(id) => <Input id={id} type="date" {...register('due_date')} />}
      </Field>
      <Field label="Cliente (opcional)">
        {(id) => (
          <RefSelect
            id={id}
            items={clients.data}
            current={task?.client}
            emptyLabel="Sem cliente"
            {...register('client_id', {
              onChange: () => {
                setValue('project_id', '')
                setValue('content_id', '')
              },
            })}
          />
        )}
      </Field>
      <Field label="Projeto (opcional)" hint={clientId ? undefined : 'Escolha um cliente primeiro.'}>
        {(id) => (
          <RefSelect id={id} items={clientId ? projects.data : []} emptyLabel="Sem projeto" disabled={!clientId} {...register('project_id')} />
        )}
      </Field>
      <Field label="Conteúdo relacionado (opcional)" hint={clientId ? undefined : 'Escolha um cliente primeiro.'}>
        {(id) => (
          <RefSelect
            id={id}
            items={clientId ? contents.data : []}
            current={task?.client_id === clientId ? task?.content : null}
            emptyLabel="Sem conteúdo" disabled={!clientId} {...register('content_id')} />
        )}
      </Field>

      <div className="rounded-xl border border-line bg-night/40 p-4 sm:col-span-2">
        {task ? <TaskChecklist taskId={task.id} /> : <DraftChecklist items={draftItems} onChange={setDraftItems} />}
      </div>

      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {task ? 'Salvar alterações' : 'Criar tarefa'}
        </Button>
      </div>
    </form>
  )
}
