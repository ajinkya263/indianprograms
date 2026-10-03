-- ============================================
-- Social Media Publishing Schema
-- ============================================

-- Connected social accounts per user
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'threads', 'linkedin', 'tiktok', 'youtube')),
  account_name text NOT NULL,
  account_handle text DEFAULT '',
  external_account_id text DEFAULT '',
  access_token text DEFAULT '',
  refresh_token text DEFAULT '',
  token_expires_at timestamptz,
  connected_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  avatar_url text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, platform, external_account_id)
);

-- Scheduled posts (one-time or recurring)
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Content
  title text DEFAULT '',
  content text NOT NULL,
  image_url text DEFAULT '',
  link_url text DEFAULT '',
  hashtags text DEFAULT '',

  -- Per-platform content overrides
  platform_content jsonb DEFAULT '{}'::jsonb,

  -- Target platforms
  platforms text[] NOT NULL DEFAULT '{}',

  -- Schedule type
  schedule_type text NOT NULL DEFAULT 'now' CHECK (schedule_type IN ('now', 'once', 'recurring')),
  scheduled_for timestamptz,

  -- Recurrence rules
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_interval integer DEFAULT 1,
  recurrence_days_of_week integer[],
  recurrence_times_of_day text[],
  recurrence_end_date date,
  recurrence_max_runs integer,

  -- Status
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paused', 'completed', 'cancelled', 'draft')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  next_run_at timestamptz,
  last_run_at timestamptz,
  total_runs integer DEFAULT 0
);

-- Individual post execution records
CREATE TABLE IF NOT EXISTS public.post_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id uuid NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,

  attempted_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'mock')),
  external_post_id text DEFAULT '',
  external_url text DEFAULT '',
  error_message text DEFAULT '',
  response_data jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON public.social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_next_run ON public.scheduled_posts(next_run_at);
CREATE INDEX IF NOT EXISTS idx_post_runs_post ON public.post_runs(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_runs_user ON public.post_runs(user_id);

-- RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_runs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own social accounts
CREATE POLICY "Users manage own social accounts"
  ON public.social_accounts FOR ALL
  USING (user_id = auth.uid());

-- Users can manage their own scheduled posts
CREATE POLICY "Users manage own scheduled posts"
  ON public.scheduled_posts FOR ALL
  USING (user_id = auth.uid());

-- Users can view their own post runs
CREATE POLICY "Users view own post runs"
  ON public.post_runs FOR SELECT
  USING (user_id = auth.uid());
