import { addDaysISO, monthBounds, todayISO } from '../lib/dates'
import { DONE_STATUSES, IN_PRODUCTION_STATUSES, NOT_STARTED_STATUSES } from '../lib/options'
import { supabase } from '../lib/supabase'
import type { ActivityLog, ContentWithRelations, TaskWithRelations } from '../types/domain'
import { listRecentActivity } from './activity'
import { listTasks } from './tasks'

const CONTENT_SELECT =
  '*, client:clients!contents_client_id_fkey(id, name), project:projects!contents_project_same_client_fk(id, name)'

const doneList = `(${DONE_STATUSES.join(',')})`

export type DashboardData = {
  counts: {
    inProduction: number
    notStarted: number
    overdue: number
    doneThisMonth: number
    openTasks: number
  }
  upcoming: ContentWithRelations[]
  priority: ContentWithRelations[]
  tasksToday: TaskWithRelations[]
  activity: ActivityLog[]
}

/** head: true = só a contagem, sem trazer as linhas. */
function countContents() {
  return supabase.from('contents').select('id', { count: 'exact', head: true }).is('archived_at', null)
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = todayISO()
  const month = monthBounds()

  // As consultas são independentes, então rodam em paralelo.
  const [inProduction, notStarted, overdue, doneThisMonth, openTasks, upcoming, priority, tasksToday, activity] =
    await Promise.all([
      countContents().in('production_status', IN_PRODUCTION_STATUSES),
      countContents().in('production_status', NOT_STARTED_STATUSES),
      countContents()
        .not('production_status', 'in', doneList)
        .or(`production_due_date.lt.${today},scheduled_date.lt.${today}`),
      supabase
        .from('contents')
        .select('id', { count: 'exact', head: true })
        .gte('finished_at', month.from)
        .lte('finished_at', month.to),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .neq('status', 'completed'),
      supabase
        .from('contents')
        .select(CONTENT_SELECT)
        .is('archived_at', null)
        .neq('production_status', 'published')
        .gte('scheduled_date', today)
        .lte('scheduled_date', addDaysISO(today, 30))
        .order('scheduled_date')
        .limit(6),
      supabase
        .from('contents')
        .select(CONTENT_SELECT)
        .is('archived_at', null)
        .not('production_status', 'in', doneList)
        .not('production_due_date', 'is', null)
        .order('production_due_date')
        .limit(6),
      listTasks({ status: 'open', dueUntil: today }),
      listRecentActivity(10),
    ])

  for (const result of [inProduction, notStarted, overdue, doneThisMonth, openTasks, upcoming, priority]) {
    if (result.error) throw result.error
  }

  return {
    counts: {
      inProduction: inProduction.count ?? 0,
      notStarted: notStarted.count ?? 0,
      overdue: overdue.count ?? 0,
      doneThisMonth: doneThisMonth.count ?? 0,
      openTasks: openTasks.count ?? 0,
    },
    upcoming: upcoming.data ?? [],
    priority: priority.data ?? [],
    tasksToday: tasksToday.slice(0, 8),
    activity,
  }
}
