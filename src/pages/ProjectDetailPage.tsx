import { ArrowLeft, CalendarRange, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ContentsPanel } from '../components/contents/ContentsPanel'
import { ProjectFormModal } from '../components/projects/ProjectFormModal'
import { TasksPanel } from '../components/tasks/TasksPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { formatLongDate } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { PROJECT_STATUSES, findOption } from '../lib/options'
import { deleteProject, getProject } from '../services/projects'

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const project = useAsync(() => getProject(id), [id])
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (project.loading && !project.data) return <LoadingState />
  if (project.error || !project.data) return <ErrorState message={project.error ?? 'Projeto não encontrado.'} onRetry={project.reload} />

  const p = project.data

  async function remove() {
    try {
      await deleteProject(p.id)
      toast.success('Projeto excluído.')
      navigate('/projetos')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/projetos" className="inline-flex items-center gap-1 hover:text-heading">
            <ArrowLeft className="size-3.5" /> Projetos
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.name}
            <Badge option={findOption(PROJECT_STATUSES, p.status)} />
          </span>
        }
        description={
          p.client && (
            <Link to={`/clientes/${p.client.id}`} className="hover:text-neon">
              {p.client.name}
            </Link>
          )
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Excluir projeto">
              <Trash2 className="size-4" />
            </Button>
          </>
        }
      />

      {(p.description || p.start_date || p.end_date || p.internal_notes) && (
        <Card className="mb-6 grid gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-subtle">Descrição</p>
            <p className="text-sm whitespace-pre-line text-muted">{p.description ?? 'Sem descrição.'}</p>
            {p.internal_notes && (
              <div className="mt-4 rounded-xl border border-pink/20 bg-pink/5 p-3">
                <p className="mb-1 text-xs font-medium text-neon">Observações internas</p>
                <p className="text-sm whitespace-pre-line text-muted">{p.internal_notes}</p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-3">
            <CalendarRange className="mt-0.5 size-4 text-subtle" />
            <div className="text-sm">
              <p className="text-xs text-subtle">Período</p>
              <p>Início: {formatLongDate(p.start_date)}</p>
              <p>Término: {p.end_date ? formatLongDate(p.end_date) : 'sem data definida'}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ContentsPanel
          filters={{ projectId: p.id }}
          newHref={`/conteudos/novo?cliente=${p.client_id}&projeto=${p.id}`}
          hideClient
        />
        <TasksPanel filters={{ projectId: p.id }} defaults={{ client_id: p.client_id, project_id: p.id }} />
      </div>

      <ProjectFormModal
        open={editing}
        project={p}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          project.reload()
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Excluir projeto?"
        message="O projeto será excluído definitivamente. Os conteúdos e tarefas dele NÃO são apagados: continuam no cliente, apenas sem projeto."
        confirmLabel="Excluir projeto"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
