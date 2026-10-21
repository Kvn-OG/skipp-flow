import { Archive, ArchiveRestore, ArrowLeft, AtSign, FolderKanban, Mail, Pencil, Phone, Plus, User } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ClientFormModal } from '../components/clients/ClientFormModal'
import { ContentsPanel } from '../components/contents/ContentsPanel'
import { ProjectFormModal } from '../components/projects/ProjectFormModal'
import { TasksPanel } from '../components/tasks/TasksPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { CLIENT_STATUSES, PROJECT_STATUSES, findOption } from '../lib/options'
import { getClient, setClientStatus } from '../services/clients'
import { listProjects } from '../services/projects'

function InfoItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-subtle [&>svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-subtle">{label}</p>
        <div className="text-sm break-words">{children}</div>
      </div>
    </div>
  )
}

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const client = useAsync(() => getClient(id), [id])
  const projects = useAsync(() => listProjects({ clientId: id }), [id])
  const [editing, setEditing] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  if (client.loading && !client.data) return <LoadingState />
  if (client.error || !client.data) return <ErrorState message={client.error ?? 'Cliente não encontrado.'} onRetry={client.reload} />

  const c = client.data
  const archived = c.status === 'archived'

  async function toggleArchive() {
    try {
      const saved = await setClientStatus(c.id, archived ? 'active' : 'archived')
      client.setData(() => saved)
      toast.success(archived ? 'Cliente reativado.' : 'Cliente arquivado.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/clientes" className="inline-flex items-center gap-1 hover:text-heading">
            <ArrowLeft className="size-3.5" /> Clientes
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.name}
            {archived && <Badge option={findOption(CLIENT_STATUSES, c.status)} />}
          </span>
        }
        description={`Cliente desde ${formatDate(c.created_at)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button variant={archived ? 'secondary' : 'ghost'} onClick={() => (archived ? toggleArchive() : setConfirmArchive(true))}>
              {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              {archived ? 'Reativar' : 'Arquivar'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-5">
            {c.instagram_username || c.instagram_url ? (
              <InfoItem icon={<AtSign />} label="Instagram">
                {c.instagram_url ? (
                  <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-neon hover:underline">
                    @{c.instagram_username ?? c.instagram_url}
                  </a>
                ) : (
                  `@${c.instagram_username}`
                )}
              </InfoItem>
            ) : null}
            {c.contact_name && (
              <InfoItem icon={<User />} label="Contato principal">
                {c.contact_name}
              </InfoItem>
            )}
            {c.email && (
              <InfoItem icon={<Mail />} label="E-mail">
                <a href={`mailto:${c.email}`} className="hover:text-neon">
                  {c.email}
                </a>
              </InfoItem>
            )}
            {c.phone && (
              <InfoItem icon={<Phone />} label="Telefone">
                <a href={`tel:${c.phone}`} className="hover:text-neon">
                  {c.phone}
                </a>
              </InfoItem>
            )}
            {c.description && (
              <div className="border-t border-line pt-4">
                <p className="mb-1 text-xs text-subtle">Sobre o negócio</p>
                <p className="text-sm whitespace-pre-line text-muted">{c.description}</p>
              </div>
            )}
            {c.internal_notes && (
              <div className="rounded-xl border border-pink/20 bg-pink/5 p-3">
                <p className="mb-1 text-xs font-medium text-neon">Observações internas</p>
                <p className="text-sm whitespace-pre-line text-muted">{c.internal_notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Projetos"
              icon={<FolderKanban />}
              action={
                <Button size="sm" variant="secondary" onClick={() => setCreatingProject(true)} disabled={archived}>
                  <Plus className="size-3.5" /> Novo
                </Button>
              }
            />
            {projects.loading && !projects.data ? (
              <LoadingState />
            ) : projects.data?.length ? (
              <ul className="divide-y divide-line">
                {projects.data.map((project) => (
                  <li key={project.id}>
                    <Link
                      to={`/projetos/${project.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="truncate text-sm font-medium">{project.name}</span>
                      <Badge option={findOption(PROJECT_STATUSES, project.status)} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="Nenhum projeto" />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <ContentsPanel filters={{ clientId: c.id }} newHref={`/conteudos/novo?cliente=${c.id}`} hideClient />
          <TasksPanel filters={{ clientId: c.id }} defaults={{ client_id: c.id }} />
        </div>
      </div>

      <ClientFormModal
        open={editing}
        client={c}
        onClose={() => setEditing(false)}
        onSaved={(saved) => {
          client.setData(() => saved)
          setEditing(false)
        }}
      />
      <ProjectFormModal
        open={creatingProject}
        defaultClientId={c.id}
        onClose={() => setCreatingProject(false)}
        onSaved={() => {
          setCreatingProject(false)
          projects.reload()
        }}
      />
      <ConfirmDialog
        open={confirmArchive}
        title="Arquivar cliente?"
        message="O cliente sai da lista de ativos e não aparece mais nos formulários. Projetos, conteúdos e tarefas são mantidos. Você pode reativá-lo quando quiser."
        confirmLabel="Arquivar"
        onConfirm={toggleArchive}
        onClose={() => setConfirmArchive(false)}
      />
    </>
  )
}
