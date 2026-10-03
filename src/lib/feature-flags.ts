import { createClient } from '@/lib/supabase/client'

export interface FeatureFlag {
  id: string
  key: string
  label: string
  description: string
  category: string
  enabled: boolean
  icon: string
  href: string
  sort_order: number
}

/**
 * Fetch all feature flags. Returns a map keyed by flag key.
 */
export async function getFeatureFlags(): Promise<Record<string, FeatureFlag>> {
  const supabase = createClient()
  const { data } = await supabase.from('feature_flags').select('*').order('sort_order')
  const map: Record<string, FeatureFlag> = {}
  for (const flag of (data || []) as FeatureFlag[]) {
    map[flag.key] = flag
  }
  return map
}

/**
 * Check if a single flag is enabled. Defaults to true if the flag doesn't exist.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .maybeSingle()
  if (!data) return true // default enabled if flag missing
  return data.enabled
}
