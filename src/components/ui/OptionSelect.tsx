import type { ComponentProps } from 'react'
import type { Option } from '../../lib/options'
import { Select } from './Form'

type OptionSelectProps = ComponentProps<'select'> & {
  options: readonly Option[]
  /** Texto da primeira opção vazia (ex.: "Todos"). Sem ele, não há opção vazia. */
  emptyLabel?: string
}

export function OptionSelect({ options, emptyLabel, ...props }: OptionSelectProps) {
  return (
    <Select {...props}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}

type RefItem = { id: string; name?: string; title?: string }

type RefSelectProps = ComponentProps<'select'> & {
  items: readonly RefItem[] | undefined
  emptyLabel: string
  /** Registro já vinculado que pode não estar na lista (ex.: cliente arquivado). */
  current?: RefItem | null
}

/**
 * Select de registros do banco (clientes, projetos, conteúdos).
 * Enquanto as opções carregam, mostra um select provisório SEM o ref do
 * formulário. Quando o select real monta, o React Hook Form aplica nele o
 * valor salvo, que agora já existe entre as opções.
 */
export function RefSelect({ items, emptyLabel, current, ...props }: RefSelectProps) {
  if (!items) {
    return (
      <Select id={props.id} disabled aria-busy>
        <option>Carregando...</option>
      </Select>
    )
  }
  const all = current && !items.some((i) => i.id === current.id) ? [current, ...items] : items
  return (
    <Select {...props}>
      <option value="">{emptyLabel}</option>
      {all.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name ?? item.title}
        </option>
      ))}
    </Select>
  )
}
