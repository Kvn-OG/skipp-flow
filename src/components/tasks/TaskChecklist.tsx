import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/cn'
import { errorMessage } from '../../lib/errors'
import { addChecklistItem, deleteChecklistItem, listChecklist, toggleChecklistItem } from '../../services/tasks'
import type { ChecklistItem } from '../../types/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Form'

type Item = { id: string; title: string; is_completed: boolean }

/** Linha de checklist (compartilhada entre o modo salvo e o rascunho). */
function ChecklistRow({ item, onToggle, onRemove }: { item: Item; onToggle: () => void; onRemove: () => void }) {
  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.is_completed}
        aria-label={item.title}
        onClick={onToggle}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          item.is_completed ? 'border-success bg-success text-ink' : 'border-line-strong hover:border-pink',
        )}
      >
        {item.is_completed && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <span className={cn('flex-1 text-sm', item.is_completed && 'text-subtle line-through')}>{item.title}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${item.title}`}
        className="rounded p-1 text-subtle opacity-0 group-hover:opacity-100 hover:text-red-300 focus:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  )
}

function AddItemForm({ onAdd }: { onAdd: (title: string) => Promise<void> | void }) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  // Este form fica dentro do form da tarefa, então usa um <div> e trata o
  // Enter manualmente (formulários aninhados não são permitidos no HTML).
  async function submit(event?: FormEvent) {
    event?.preventDefault()
    const value = title.trim()
    if (!value) return
    setBusy(true)
    try {
      await onAdd(value)
      setTitle('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void submit()
          }
        }}
        placeholder="Novo item do checklist"
        aria-label="Novo item do checklist"
      />
      <Button variant="secondary" onClick={() => submit()} loading={busy} aria-label="Adicionar item">
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

function Progress({ items }: { items: Item[] }) {
  const done = items.filter((i) => i.is_completed).length
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted">Checklist</span>
      {items.length > 0 && (
        <span className="text-xs text-subtle">
          {done}/{items.length}
        </span>
      )}
    </div>
  )
}

/** Checklist de uma tarefa já salva: cada ação grava direto no banco. */
export function TaskChecklist({ taskId }: { taskId: string }) {
  const toast = useToast()
  const { data: items = [], setData, loading } = useAsync(() => listChecklist(taskId), [taskId])

  async function run(action: () => Promise<void>, rollback: ChecklistItem[]) {
    try {
      await action()
    } catch (error) {
      setData(() => rollback)
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <Progress items={items} />
      {loading && items.length === 0 ? (
        <p className="py-2 text-xs text-subtle">Carregando...</p>
      ) : (
        <ul className="mt-1">
          {items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => {
                const before = items
                setData((list) => list?.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)))
                void run(() => toggleChecklistItem(item.id, !item.is_completed), before)
              }}
              onRemove={() => {
                const before = items
                setData((list) => list?.filter((i) => i.id !== item.id))
                void run(() => deleteChecklistItem(item.id), before)
              }}
            />
          ))}
        </ul>
      )}
      <AddItemForm
        onAdd={async (title) => {
          try {
            const created = await addChecklistItem(taskId, title, items.length)
            setData((list) => [...(list ?? []), created])
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />
    </div>
  )
}

/** Checklist de uma tarefa nova: fica só na memória até a tarefa ser salva. */
export function DraftChecklist({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const rows = items.map((title, index) => ({ id: String(index), title, is_completed: false }))
  return (
    <div>
      <Progress items={rows} />
      <ul className="mt-1">
        {rows.map((row, index) => (
          <ChecklistRow key={row.id} item={row} onToggle={() => {}} onRemove={() => onChange(items.filter((_, i) => i !== index))} />
        ))}
      </ul>
      <AddItemForm onAdd={(title) => onChange([...items, title])} />
    </div>
  )
}
