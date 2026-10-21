import { Clapperboard, Plus } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { listContents, type ContentFilters } from '../../services/contents'
import { ButtonLink } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../ui/States'
import { ContentRow } from './ContentRow'

type ContentsPanelProps = {
  filters: ContentFilters
  /** Link do botão "Novo" já com cliente/projeto preenchidos. */
  newHref: string
  hideClient?: boolean
}

export function ContentsPanel({ filters, newHref, hideClient }: ContentsPanelProps) {
  const key = JSON.stringify(filters)
  const { data, loading, error, reload } = useAsync(() => listContents(filters), [key])

  return (
    <Card>
      <CardHeader
        title="Conteúdos"
        description={data ? `${data.length} ativo${data.length === 1 ? '' : 's'}` : undefined}
        icon={<Clapperboard />}
        action={
          <ButtonLink to={newHref} size="sm" variant="secondary">
            <Plus className="size-3.5" /> Novo
          </ButtonLink>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : data?.length ? (
        <ul className="divide-y divide-line">
          {data.map((content) => (
            <ContentRow key={content.id} content={content} hideClient={hideClient} />
          ))}
        </ul>
      ) : (
        <EmptyState compact title="Nenhum conteúdo ainda" description="Os conteúdos cadastrados aparecerão aqui." />
      )}
    </Card>
  )
}
