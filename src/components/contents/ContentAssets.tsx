import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Link2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/errors'
import { ASSET_KINDS, findOption } from '../../lib/options'
import { assetSchema, type AssetFormInput, type AssetFormOutput } from '../../schemas/content'
import { createAsset, deleteAsset, listAssets } from '../../services/assets'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { Field, Input } from '../ui/Form'
import { Modal } from '../ui/Modal'
import { OptionSelect } from '../ui/OptionSelect'
import { EmptyState, LoadingState } from '../ui/States'

/** Links de materiais do conteúdo (vídeos, artes, referências, pastas do Drive). */
export function ContentAssets({ contentId }: { contentId: string }) {
  const toast = useToast()
  const { data, loading, setData } = useAsync(() => listAssets(contentId), [contentId])
  const [adding, setAdding] = useState(false)

  async function remove(id: string) {
    const before = data
    setData((list) => list?.filter((a) => a.id !== id))
    try {
      await deleteAsset(id)
    } catch (error) {
      setData(() => before)
      toast.error(errorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader
        title="Arquivos e materiais"
        description="Links para Drive, vídeos, artes e referências"
        icon={<Link2 />}
        action={
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Adicionar
          </Button>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : data?.length ? (
        <ul className="divide-y divide-line">
          {data.map((asset) => (
            <li key={asset.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium hover:text-neon"
                >
                  <span className="truncate">{asset.name}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
                {asset.description && <p className="truncate text-xs text-muted">{asset.description}</p>}
              </div>
              <Badge option={findOption(ASSET_KINDS, asset.kind)} dot={false} />
              <Button variant="ghost" size="icon" aria-label={`Remover ${asset.name}`} onClick={() => remove(asset.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact title="Nenhum material vinculado" description="Adicione links de vídeos brutos, artes, referências ou pastas do Drive." />
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Adicionar material">
        <AssetForm
          contentId={contentId}
          onCancel={() => setAdding(false)}
          onSaved={(asset) => {
            setData((list) => [...(list ?? []), asset])
            setAdding(false)
          }}
        />
      </Modal>
    </Card>
  )
}

function AssetForm({
  contentId,
  onCancel,
  onSaved,
}: {
  contentId: string
  onCancel: () => void
  onSaved: (asset: Awaited<ReturnType<typeof createAsset>>) => void
}) {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormInput, unknown, AssetFormOutput>({
    resolver: zodResolver(assetSchema),
    defaultValues: { name: '', url: '', kind: 'drive_folder', description: '' },
  })

  async function onSubmit(values: AssetFormOutput) {
    try {
      onSaved(await createAsset({ ...values, content_id: contentId }))
      toast.success('Material adicionado.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Nome" required error={errors.name?.message}>
        {(id) => <Input id={id} autoFocus placeholder="Ex.: Vídeo bruto gravação 21/10" aria-invalid={!!errors.name} {...register('name')} />}
      </Field>
      <Field label="Link" required error={errors.url?.message}>
        {(id) => <Input id={id} type="url" placeholder="https://" aria-invalid={!!errors.url} {...register('url')} />}
      </Field>
      <Field label="Tipo">{(id) => <OptionSelect id={id} options={ASSET_KINDS} {...register('kind')} />}</Field>
      <Field label="Descrição (opcional)">{(id) => <Input id={id} {...register('description')} />}</Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Adicionar
        </Button>
      </div>
    </form>
  )
}
