import { supabase } from '../lib/supabase'
import type { TablesInsert } from '../types/database'
import type { ContentAsset } from '../types/domain'

export async function listAssets(contentId: string): Promise<ContentAsset[]> {
  const { data, error } = await supabase
    .from('content_assets')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createAsset(values: TablesInsert<'content_assets'>): Promise<ContentAsset> {
  const { data, error } = await supabase.from('content_assets').insert(values).select().single()
  if (error) throw error
  return data
}

export async function deleteAsset(id: string) {
  const { error } = await supabase.from('content_assets').delete().eq('id', id)
  if (error) throw error
}
