export interface SocialAccount {
  id: string
  user_id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'threads' | 'linkedin' | 'tiktok' | 'youtube'
  account_name: string
  account_handle: string
  external_account_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string | null
  connected_at: string
  is_active: boolean
  avatar_url: string
  metadata: Record<string, unknown>
}

export interface ScheduledPost {
  id: string
  user_id: string
  title: string
  content: string
  image_url: string
  image_urls: string[]
  link_url: string
  hashtags: string
  platform_content: Record<string, string>
  platforms: string[]
  content_variations: string[]
  content_strategy: 'fixed' | 'rotate' | 'random'
  image_strategy: 'first' | 'rotate' | 'random' | 'collage'
  tone: string
  approval_status: 'approved' | 'pending' | 'rejected'
  schedule_type: 'now' | 'once' | 'recurring'
  scheduled_for: string | null
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom' | null
  recurrence_interval: number | null
  recurrence_days_of_week: number[] | null
  recurrence_times_of_day: string[] | null
  recurrence_end_date: string | null
  recurrence_max_runs: number | null
  event_id: string | null
  countdown_pattern: string | null
  status: 'scheduled' | 'paused' | 'completed' | 'cancelled' | 'draft'
  created_at: string
  updated_at: string
  next_run_at: string | null
  last_run_at: string | null
  total_runs: number
}

export interface PostRun {
  id: string
  scheduled_post_id: string
  user_id: string
  platform: string
  attempted_at: string
  status: 'success' | 'failed' | 'pending' | 'mock'
  external_post_id: string
  external_url: string
  error_message: string
  response_data: Record<string, unknown>
}

export const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'Facebook', maxLength: 63206 },
  { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'Instagram', maxLength: 2200 },
  { key: 'twitter', label: 'X (Twitter)', color: '#000000', icon: 'Twitter', maxLength: 280 },
  { key: 'threads', label: 'Threads', color: '#000000', icon: 'AtSign', maxLength: 500 },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: 'Linkedin', maxLength: 3000 },
  { key: 'tiktok', label: 'TikTok', color: '#000000', icon: 'Music', maxLength: 2200 },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'Youtube', maxLength: 5000 },
] as const

export type PlatformKey = (typeof PLATFORMS)[number]['key']
