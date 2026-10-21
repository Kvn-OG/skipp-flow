import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatDistanceToNow,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Datas sem horário (prazo, publicação) chegam do banco como 'AAAA-MM-DD'.
// parseISO interpreta esse formato no fuso local. new Date('2026-10-21')
// usaria UTC e, no Brasil, mostraria o dia anterior.

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(parseISO(iso), days))
}

/** Início e fim do mês no fuso local, como timestamps (para colunas timestamptz). */
export function monthBounds(reference = new Date()) {
  return { from: startOfMonth(reference).toISOString(), to: endOfMonth(reference).toISOString() }
}

/** 21 out */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return format(parseISO(iso), "d MMM", { locale: ptBR })
}

/** 21 de outubro de 2026 */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/** 21/10/2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return format(parseISO(iso), 'dd/MM/yyyy')
}

/** há 5 minutos */
export function formatRelative(timestamp: string): string {
  return formatDistanceToNow(parseISO(timestamp), { locale: ptBR, addSuffix: true })
}

/** Dias até a data (negativo = já passou). */
export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date())
}

export function isOverdue(iso: string | null | undefined): boolean {
  return !!iso && daysUntil(iso) < 0
}

/** "Hoje", "Amanhã", "Atrasado 3 dias", "Em 5 dias" */
export function describeDue(iso: string | null | undefined): string {
  if (!iso) return 'Sem data'
  const days = daysUntil(iso)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  if (days === -1) return 'Ontem'
  if (days < 0) return `Atrasado ${Math.abs(days)} dias`
  if (days <= 7) return `Em ${days} dias`
  return formatShortDate(iso)
}
