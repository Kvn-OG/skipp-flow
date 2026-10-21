import { AtSign, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { cn } from '../lib/cn'
import { CLIENT_STATUSES, findOption, type ClientStatus } from '../lib/options'
import { listClients } from '../services/clients'

export function ClientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ClientStatus>('active')
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error, reload } = useAsync(
    () => listClients({ search: debouncedSearch, status }),
    [debouncedSearch, status],
  )

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Marcas atendidas pela SKIPP."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Novo cliente
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome, contato ou @" className="flex-1" />
        <div role="tablist" aria-label="Situação" className="flex rounded-xl border border-line bg-surface p-1">
          {CLIENT_STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={status === option.value}
              onClick={() => setStatus(option.value)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                status === option.value ? 'bg-roxo/30 text-heading' : 'text-muted hover:text-heading',
              )}
            >
              {option.value === 'active' ? 'Ativos' : 'Arquivados'}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((client) => (
            <Link key={client.id} to={`/clientes/${client.id}`} className="group">
              <Card className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:border-pink/40 group-hover:bg-surface-2">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand font-title text-lg font-bold uppercase">
                    {client.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{client.name}</p>
                    {client.instagram_username ? (
                      <p className="flex items-center gap-1 truncate text-sm text-muted">
                        <AtSign className="size-3.5" />
                        {client.instagram_username}
                      </p>
                    ) : (
                      <p className="text-sm text-subtle">Sem Instagram cadastrado</p>
                    )}
                  </div>
                  {client.status === 'archived' && <Badge option={findOption(CLIENT_STATUSES, client.status)} />}
                </div>
                {client.description && <p className="line-clamp-2 text-sm text-muted">{client.description}</p>}
                {client.contact_name && <p className="mt-auto text-xs text-subtle">Contato: {client.contact_name}</p>}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Users />}
            title={search ? 'Nenhum cliente encontrado' : status === 'active' ? 'Nenhum cliente ativo' : 'Nenhum cliente arquivado'}
            description={search ? 'Tente outro termo de pesquisa.' : 'Cadastre o primeiro cliente para começar.'}
            action={
              !search &&
              status === 'active' && (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="size-4" /> Novo cliente
                </Button>
              )
            }
          />
        </Card>
      )}

      <ClientFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(client) => {
          setCreating(false)
          navigate(`/clientes/${client.id}`)
        }}
      />
    </>
  )
}
