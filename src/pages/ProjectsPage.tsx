import { CalendarRange, FolderKanban, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ProjectFormModal } from '../components/projects/ProjectFormModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { OptionSelect, RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatShortDate } from '../lib/dates'
import { PROJECT_STATUSES, findOption, type ProjectStatus } from '../lib/options'
import { listClientOptions } from '../services/clients'
import { listProjects } from '../services/projects'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const clients = useAsync(listClientOptions, [])
  const { data, loading, error, reload } = useAsync(
    () => listProjects({ search: debouncedSearch, clientId: clientId || undefined, status: status || undefined }),
    [debouncedSearch, clientId, status],
  )

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Campanhas e frentes de trabalho de cada cliente."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Novo projeto
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem_12rem]">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar projetos" />
        <RefSelect aria-label="Filtrar por cliente" items={clients.data} emptyLabel="Todos os clientes" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <OptionSelect
          aria-label="Filtrar por status"
          options={PROJECT_STATUSES}
          emptyLabel="Todos os status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
        />
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data?.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {data.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/projetos/${project.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="truncate text-sm text-muted">{project.client?.name}</p>
                  </div>
                  {(project.start_date || project.end_date) && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <CalendarRange className="size-3.5" />
                      {formatShortDate(project.start_date)} → {project.end_date ? formatShortDate(project.end_date) : 'sem término'}
                    </span>
                  )}
                  <Badge option={findOption(PROJECT_STATUSES, project.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<FolderKanban />}
            title="Nenhum projeto encontrado"
            description={search || clientId || status ? 'Ajuste os filtros.' : 'Crie um projeto para agrupar conteúdos e tarefas.'}
          />
        </Card>
      )}

      <ProjectFormModal
        open={creating}
        defaultClientId={clientId || undefined}
        onClose={() => setCreating(false)}
        onSaved={(project) => {
          setCreating(false)
          navigate(`/projetos/${project.id}`)
        }}
      />
    </>
  )
}
