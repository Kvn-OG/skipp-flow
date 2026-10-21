import { supabase } from '../lib/supabase'
import type { ActivityLog } from '../types/domain'

export async function listRecentActivity(limit = 10): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
