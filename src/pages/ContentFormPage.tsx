import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button'
import { Field, FormSection, Input, Textarea } from '../components/ui/Form'
import { OptionSelect, RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { cn } from '../lib/cn'
import { errorMessage } from '../lib/errors'
import { CONTENT_FORMATS, CONTENT_TYPES, PRODUCTION_STATUSES } from '../lib/options'
import { contentSchema, type ContentFormInput, type ContentFormOutput } from '../schemas/content'
import { listClientOptions } from '../services/clients'
import { createContent, getContent, updateContent } from '../services/contents'
import { listProjectOptions } from '../services/projects'
import type { ContentWithRelations } from '../types/domain'

const CAPTION_LIMIT = 2200 // limite de caracteres da legenda no Instagram

/** /conteudos/novo e /conteudos/:id/editar usam a mesma página. */
export function ContentFormPage() {
  const { id } = useParams()
  const content = useAsync(() => (id ? getContent(id) : Promise.resolve(null)), [id])

  if (id && content.loading && !content.data) return <LoadingState />
  if (id && (content.error || !content.data)) {
    return <ErrorState message={content.error ?? 'Conteúdo não encontrado.'} onRetry={content.reload} />
  }
  // key: se trocar de conteúdo, o formulário recomeça do zero
  return <ContentForm key={id ?? 'novo'} content={content.data ?? undefined} />
}

function ContentForm({ content }: { content?: ContentWithRelations }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormInput, unknown, ContentFormOutput>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: content?.title ?? '',
      client_id: content?.client_id ?? params.get('cliente') ?? '',
      project_id: content?.project_id ?? params.get('projeto') ?? '',
      format: (content?.format as ContentFormInput['format']) ?? 'reels',
      content_type: (content?.content_type as ContentFormInput['content_type']) ?? 'educational',
      editorial_pillar: content?.editorial_pillar ?? '',
      briefing: content?.briefing ?? '',
      objective: content?.objective ?? '',
      script: content?.script ?? '',
      caption: content?.caption ?? '',
      call_to_action: content?.call_to_action ?? '',
      production_status: (content?.production_status as ContentFormInput['production_status']) ?? 'idea',
      production_due_date: content?.production_due_date ?? '',
      scheduled_date: content?.scheduled_date ?? params.get('data') ?? '',
      final_asset_url: content?.final_asset_url ?? '',
      internal_notes: content?.internal_notes ?? '',
    },
  })

  // useWatch: re-renderiza quando esses campos mudam (para filtrar projetos
  // pelo cliente e atualizar o contador de caracteres da legenda)
  const clientId = useWatch({ control, name: 'client_id' })
  const captionLength = useWatch({ control, name: 'caption' })?.length ?? 0
  const clients = useAsync(listClientOptions, [])
  const projects = useAsync(() => (clientId ? listProjectOptions(clientId) : Promise.resolve([])), [clientId])

  async function onSubmit(values: ContentFormOutput) {
    try {
      const saved = content ? await updateContent(content.id, values) : await createContent(values)
      toast.success(content ? 'Conteúdo atualizado.' : 'Conteúdo criado.')
      navigate(`/conteudos/${saved.id}`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const backTo = content ? `/conteudos/${content.id}` : '/conteudos'

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={backTo} className="inline-flex items-center gap-1 hover:text-heading">
            <ArrowLeft className="size-3.5" /> {content ? 'Voltar ao conteúdo' : 'Conteúdos'}
          </Link>
        }
        title={content ? 'Editar conteúdo' : 'Novo conteúdo'}
        description="Conteúdo para o Instagram do cliente."
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <FormSection title="Identificação">
          <Field label="Título" required error={errors.title?.message} className="sm:col-span-2">
            {(id) => <Input id={id} autoFocus={!content} aria-invalid={!!errors.title} {...register('title')} />}
          </Field>
          <Field label="Cliente" required error={errors.client_id?.message}>
            {(id) => (
              <RefSelect
                id={id}
                items={clients.data}
                current={content?.client}
                emptyLabel="Selecione..."
                aria-invalid={!!errors.client_id}
                {...register('client_id', { onChange: () => setValue('project_id', '') })}
              />
            )}
          </Field>
          <Field label="Projeto (opcional)" hint={clientId ? undefined : 'Escolha um cliente primeiro.'}>
            {(id) => (
              <RefSelect id={id} items={clientId ? projects.data : []} emptyLabel="Sem projeto" disabled={!clientId} {...register('project_id')} />
            )}
          </Field>
          <Field label="Formato">{(id) => <OptionSelect id={id} options={CONTENT_FORMATS} {...register('format')} />}</Field>
          <Field label="Tipo de conteúdo">{(id) => <OptionSelect id={id} options={CONTENT_TYPES} {...register('content_type')} />}</Field>
          <Field label="Pilar editorial" hint="Ex.: Dicas de saúde, Bastidores da clínica" className="sm:col-span-2">
            {(id) => <Input id={id} {...register('editorial_pillar')} />}
          </Field>
        </FormSection>

        <FormSection title="Produção" description="Status e datas usados no pipeline, calendário e dashboard.">
          <Field label="Status de produção">
            {(id) => <OptionSelect id={id} options={PRODUCTION_STATUSES} {...register('production_status')} />}
          </Field>
          <Field label="Prazo interno de produção" error={errors.production_due_date?.message}>
            {(id) => <Input id={id} type="date" {...register('production_due_date')} />}
          </Field>
          <Field label="Data prevista de publicação" error={errors.scheduled_date?.message}>
            {(id) => <Input id={id} type="date" {...register('scheduled_date')} />}
          </Field>
          <Field label="Link dos arquivos finais" error={errors.final_asset_url?.message}>
            {(id) => (
              <Input id={id} type="url" placeholder="https://drive.google.com/..." aria-invalid={!!errors.final_asset_url} {...register('final_asset_url')} />
            )}
          </Field>
        </FormSection>

        <FormSection title="Planejamento">
          <Field label="Briefing" className="sm:col-span-2">
            {(id) => <Textarea id={id} rows={4} {...register('briefing')} />}
          </Field>
          <Field label="Objetivo" className="sm:col-span-2">
            {(id) => <Textarea id={id} rows={2} {...register('objective')} />}
          </Field>
        </FormSection>

        <FormSection title="Roteiro e legenda">
          <Field label="Roteiro" className="sm:col-span-2">
            {(id) => <Textarea id={id} rows={8} {...register('script')} />}
          </Field>
          <Field label="Legenda" className="sm:col-span-2">
            {(id) => (
              <>
                <Textarea id={id} rows={6} {...register('caption')} />
                <span className={cn('self-end text-xs', captionLength > CAPTION_LIMIT ? 'text-red-300' : 'text-subtle')}>
                  {captionLength}/{CAPTION_LIMIT}
                </span>
              </>
            )}
          </Field>
          <Field label="CTA (chamada para ação)" className="sm:col-span-2">
            {(id) => <Input id={id} placeholder="Ex.: Agende pelo link da bio" {...register('call_to_action')} />}
          </Field>
        </FormSection>

        <FormSection title="Observações internas">
          <Field label="Observações" className="sm:col-span-2">
            {(id) => <Textarea id={id} rows={3} {...register('internal_notes')} />}
          </Field>
        </FormSection>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-ink/90 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
          <Button variant="ghost" onClick={() => navigate(backTo)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {content ? 'Salvar alterações' : 'Criar conteúdo'}
          </Button>
        </div>
      </form>
    </>
  )
}
