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
-- ============================================
-- Social Media v2: AI rewording, multiple images, content variations
-- ============================================

-- Add multiple images support and content variations
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_variations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_strategy text DEFAULT 'fixed' CHECK (content_strategy IN ('fixed', 'rotate', 'random')),
  ADD COLUMN IF NOT EXISTS image_strategy text DEFAULT 'first' CHECK (image_strategy IN ('first', 'rotate', 'random', 'collage')),
  ADD COLUMN IF NOT EXISTS tone text DEFAULT 'vibrant',
  ADD COLUMN IF NOT EXISTS auto_hashtags boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS link_shortener boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS utm_source text DEFAULT '',
  ADD COLUMN IF NOT EXISTS utm_medium text DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS utm_campaign text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected'));

-- Content templates for reuse
CREATE TABLE IF NOT EXISTS public.post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  content text NOT NULL,
  hashtags text DEFAULT '',
  image_urls text[] DEFAULT '{}',
  platforms text[] DEFAULT '{}',
  tone text DEFAULT 'vibrant',
  category text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  use_count integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_post_templates_user ON public.post_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_post_templates_category ON public.post_templates(category);

ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates"
  ON public.post_templates FOR ALL
  USING (user_id = auth.uid());

-- AI generation log (for tracking and credit usage)
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generation_type text NOT NULL,
  input_text text DEFAULT '',
  output_data jsonb DEFAULT '{}'::jsonb,
  tone text DEFAULT '',
  variation_count integer DEFAULT 0,
  cost_estimate numeric(10, 6) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON public.ai_generations(user_id);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI generations"
  ON public.ai_generations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own AI generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (user_id = auth.uid());
-- ============================================
-- Social Media v3: Industry-First Features
-- Voice profiles, festivals, hashtag intel, analytics,
-- approval workflows, A/B testing, content recycling
-- ============================================

-- ─────────────────────────────────────────
-- 1. Voice Profiles (AI Content DNA)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name text DEFAULT '',
  brand_description text DEFAULT '',
  sample_posts text[] DEFAULT '{}',
  detected_tone text DEFAULT '',
  detected_style text DEFAULT '',
  vocabulary_keywords text[] DEFAULT '{}',
  emoji_usage text DEFAULT '',
  hashtag_style text DEFAULT '',
  voice_summary text DEFAULT '',
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own voice profile" ON public.voice_profiles FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 2. Festival Calendar (Indian cultural dates)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.festivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  emoji text DEFAULT '',
  is_major boolean DEFAULT false,
  region text DEFAULT 'pan-india',
  greeting text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_festivals_date ON public.festivals(date);

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read festivals" ON public.festivals FOR SELECT USING (true);

-- Seed major Indian festivals for 2026
INSERT INTO public.festivals (name, date, description, emoji, is_major, greeting) VALUES
  ('Makar Sankranti', '2026-01-14', 'Harvest festival marking the sun''s transition into Capricorn', '🪁', true, 'Happy Makar Sankranti! May this festival bring joy and prosperity.'),
  ('Pongal', '2026-01-15', 'Tamil harvest festival', '🌾', true, 'Happy Pongal! Celebrating harvest and prosperity.'),
  ('Republic Day', '2026-01-26', 'India''s Republic Day', '🇮🇳', true, 'Happy Republic Day! Celebrating the spirit of India.'),
  ('Vasant Panchami', '2026-01-23', 'Festival honoring Goddess Saraswati', '📚', false, 'Happy Vasant Panchami! May knowledge and wisdom guide you.'),
  ('Maha Shivaratri', '2026-02-15', 'The great night of Lord Shiva', '🕉️', true, 'Har Har Mahadev! May Lord Shiva''s blessings be with you.'),
  ('Holi', '2026-03-04', 'Festival of colors', '🎨', true, 'Happy Holi! May your life be filled with vibrant colors of joy.'),
  ('Ugadi', '2026-03-19', 'Telugu and Kannada New Year', '🌺', true, 'Happy Ugadi! Wishing you a prosperous new year.'),
  ('Gudi Padwa', '2026-03-19', 'Marathi New Year', '🪔', true, 'Gudi Padwa chya hardik shubhechha!'),
  ('Ram Navami', '2026-03-27', 'Birth of Lord Rama', '🏹', true, 'Jai Shree Ram! Happy Ram Navami.'),
  ('Hanuman Jayanti', '2026-04-02', 'Birth of Lord Hanuman', '💪', false, 'Jai Bajrang Bali!'),
  ('Baisakhi', '2026-04-13', 'Punjabi harvest festival and Sikh New Year', '🌾', true, 'Happy Baisakhi! Celebrating harvest and new beginnings.'),
  ('Buddha Purnima', '2026-05-01', 'Birth of Lord Buddha', '☸️', false, 'Happy Buddha Purnima! May peace prevail.'),
  ('Eid al-Fitr', '2026-03-20', 'End of Ramadan', '🌙', true, 'Eid Mubarak!'),
  ('Rath Yatra', '2026-07-15', 'Lord Jagannath''s chariot festival', '🛕', false, 'Jai Jagannath!'),
  ('Raksha Bandhan', '2026-08-28', 'Bond between brothers and sisters', '🪢', true, 'Happy Raksha Bandhan! Celebrating the bond of love.'),
  ('Krishna Janmashtami', '2026-09-04', 'Birth of Lord Krishna', '🦚', true, 'Happy Janmashtami! Jai Shree Krishna.'),
  ('Ganesh Chaturthi', '2026-09-14', 'Birth of Lord Ganesha', '🐘', true, 'Ganpati Bappa Morya! Happy Ganesh Chaturthi.'),
  ('Onam', '2026-08-26', 'Kerala harvest festival', '🌼', true, 'Happy Onam! Wishing you joy and prosperity.'),
  ('Navratri', '2026-10-11', 'Nine nights of Goddess Durga', '💃', true, 'Happy Navratri! May Maa Durga bless you.'),
  ('Durga Puja', '2026-10-17', 'Worship of Goddess Durga', '🌺', true, 'Shubho Durga Puja!'),
  ('Dussehra', '2026-10-20', 'Victory of good over evil', '🏹', true, 'Happy Dussehra! Celebrating victory of righteousness.'),
  ('Karva Chauth', '2026-11-01', 'Festival for married women', '🌙', false, 'Happy Karva Chauth!'),
  ('Diwali', '2026-11-08', 'Festival of lights', '🪔', true, 'Happy Diwali! May the festival of lights brighten your life.'),
  ('Bhai Dooj', '2026-11-11', 'Sister-brother bond', '👫', false, 'Happy Bhai Dooj!'),
  ('Chhath Puja', '2026-11-15', 'Sun god worship', '🌅', false, 'Happy Chhath Puja!'),
  ('Guru Nanak Jayanti', '2026-11-24', 'Birth of Guru Nanak', '🙏', true, 'Happy Gurpurab! Sat Sri Akal.'),
  ('Christmas', '2026-12-25', 'Birth of Jesus Christ', '🎄', false, 'Merry Christmas!')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- 3. Hashtag Intelligence
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hashtag_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag text NOT NULL UNIQUE,
  category text DEFAULT '',
  metro text DEFAULT '',
  usage_count integer DEFAULT 0,
  effectiveness_score numeric(5,2) DEFAULT 0,
  is_banned boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtag_stats_tag ON public.hashtag_stats(hashtag);
CREATE INDEX IF NOT EXISTS idx_hashtag_stats_metro ON public.hashtag_stats(metro);
CREATE INDEX IF NOT EXISTS idx_hashtag_stats_trending ON public.hashtag_stats(is_trending);

ALTER TABLE public.hashtag_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hashtag stats" ON public.hashtag_stats FOR SELECT USING (true);

-- Seed common Indian cultural hashtags
INSERT INTO public.hashtag_stats (hashtag, category, effectiveness_score, is_trending) VALUES
  ('#diwali', 'festival', 95.0, true),
  ('#bollywood', 'entertainment', 92.0, true),
  ('#desi', 'culture', 88.0, true),
  ('#indianevents', 'general', 85.0, true),
  ('#bayareaindians', 'community', 82.0, true),
  ('#nyindians', 'community', 80.0, true),
  ('#houstondesi', 'community', 78.0, true),
  ('#dallasindian', 'community', 76.0, true),
  ('#carnaticmusic', 'music', 75.0, false),
  ('#bharatanatyam', 'dance', 73.0, false),
  ('#kathak', 'dance', 72.0, false),
  ('#garba', 'dance', 90.0, true),
  ('#dandiya', 'dance', 88.0, true),
  ('#navratri', 'festival', 92.0, true),
  ('#holi', 'festival', 93.0, true),
  ('#ganeshchaturthi', 'festival', 90.0, true),
  ('#tamilevents', 'community', 78.0, false),
  ('#teluguevents', 'community', 78.0, false),
  ('#marathievents', 'community', 78.0, false),
  ('#gujaratievents', 'community', 78.0, false),
  ('#punjabievents', 'community', 78.0, false),
  ('#bengalievents', 'community', 78.0, false),
  ('#indianculture', 'culture', 86.0, true),
  ('#desievents', 'general', 84.0, true),
  ('#indianamerica', 'community', 82.0, true)
ON CONFLICT (hashtag) DO NOTHING;

-- ─────────────────────────────────────────
-- 4. Post Analytics
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_run_id uuid NOT NULL REFERENCES public.post_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  clicks integer DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_analytics_user ON public.post_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_run ON public.post_analytics(post_run_id);

ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analytics" ON public.post_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own analytics" ON public.post_analytics FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 5. Approval Workflows
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_post_id uuid NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_approvals_post ON public.approval_workflows(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approval_workflows(status);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own approvals" ON public.approval_workflows FOR ALL USING (user_id = auth.uid() OR approver_id = auth.uid());

-- ─────────────────────────────────────────
-- 6. Content Recycling Queue
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evergreen_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_post_id uuid NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  recycle_after_days integer NOT NULL DEFAULT 30,
  last_recycled_at timestamptz,
  recycle_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evergreen_user ON public.evergreen_posts(user_id);

ALTER TABLE public.evergreen_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own evergreen" ON public.evergreen_posts FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 7. A/B Test Variants
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'paused')),
  variants jsonb DEFAULT '[]'::jsonb,
  winner_variant_index integer,
  metric text DEFAULT 'engagement',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tests" ON public.ab_tests FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 8. Event-tied Posts (Countdown campaigns)
-- ─────────────────────────────────────────
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS countdown_pattern text,
  ADD COLUMN IF NOT EXISTS countdown_days integer[],
  ADD COLUMN IF NOT EXISTS is_evergreen boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_event ON public.scheduled_posts(event_id);
-- ============================================
-- Social Media v4: Idea Inbox, Hashtag Groups, Brand Assets,
-- Workspaces, Watermarks, Link-in-Bio, Performance Predictions
-- ============================================

-- ─────────────────────────────────────────
-- 1. Idea Inbox (capture ideas without scheduling)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  source text DEFAULT 'manual',
  source_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  used boolean DEFAULT false,
  used_at timestamptz,
  scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_ideas_user ON public.content_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_used ON public.content_ideas(used);

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ideas" ON public.content_ideas FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 2. Hashtag Groups (saved hashtag sets)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hashtag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  hashtags text NOT NULL,
  description text DEFAULT '',
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtag_groups_user ON public.hashtag_groups(user_id);

ALTER TABLE public.hashtag_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hashtag groups" ON public.hashtag_groups FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 3. Brand Assets (logos, colors, fonts, taglines)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id uuid,
  brand_name text DEFAULT '',
  logo_url text DEFAULT '',
  watermark_url text DEFAULT '',
  primary_color text DEFAULT '#E8970A',
  secondary_color text DEFAULT '#138808',
  accent_color text DEFAULT '#FFD700',
  font_heading text DEFAULT 'Playfair Display',
  font_body text DEFAULT 'DM Sans',
  tagline text DEFAULT '',
  default_signature text DEFAULT '',
  default_hashtags text DEFAULT '',
  contact_email text DEFAULT '',
  contact_website text DEFAULT '',
  watermark_position text DEFAULT 'bottom-right' CHECK (watermark_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
  watermark_opacity numeric(3,2) DEFAULT 0.7,
  watermark_size_percent integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_assets_user ON public.brand_assets(user_id);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand assets" ON public.brand_assets FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 4. Workspaces (multi-brand support)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  color text DEFAULT '#E8970A',
  emoji text DEFAULT '🪔',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workspaces" ON public.workspaces FOR ALL USING (owner_id = auth.uid());

-- Workspace members (for team collaboration)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  added_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own workspace memberships" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());

-- Add workspace_id to scheduled_posts (optional, NULL = personal)
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace ON public.scheduled_posts(workspace_id);

-- ─────────────────────────────────────────
-- 5. Link-in-Bio (Linktree-style pages)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bio_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  cover_url text DEFAULT '',
  theme text DEFAULT 'saffron' CHECK (theme IN ('saffron', 'green', 'tricolor', 'dark', 'light')),
  background_color text DEFAULT '#070510',
  text_color text DEFAULT '#FFFFFF',
  button_color text DEFAULT '#E8970A',
  show_events boolean DEFAULT true,
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bio_pages_slug ON public.bio_pages(slug);

ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bio pages" ON public.bio_pages FOR SELECT USING (true);
CREATE POLICY "Users manage own bio page" ON public.bio_pages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own bio page" ON public.bio_pages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own bio page" ON public.bio_pages FOR DELETE USING (user_id = auth.uid());

-- Bio page links (the actual links/buttons)
CREATE TABLE IF NOT EXISTS public.bio_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  is_active boolean DEFAULT true,
  position integer DEFAULT 0,
  click_count integer DEFAULT 0,
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bio_links_page ON public.bio_links(bio_page_id);

ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bio links" ON public.bio_links FOR SELECT USING (true);
CREATE POLICY "Users manage own bio links" ON public.bio_links FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 6. Post Performance Predictions
-- ─────────────────────────────────────────
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS predicted_score integer,
  ADD COLUMN IF NOT EXISTS predicted_insights jsonb DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────
-- 7. Auto-recycle rules (engagement-based)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recycle_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'category' CHECK (source_type IN ('category', 'tag', 'all')),
  source_value text DEFAULT '',
  recycle_pattern text NOT NULL DEFAULT 'weekly',
  is_active boolean DEFAULT true,
  total_recycled integer DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recycle_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recycle rules" ON public.recycle_rules FOR ALL USING (user_id = auth.uid());
-- ============================================
-- Short Links Schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  click_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_clicked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_short_links_slug ON public.short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_user ON public.short_links(user_id);
CREATE INDEX IF NOT EXISTS idx_short_links_event ON public.short_links(event_id);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read short links (needed for redirect)
CREATE POLICY "Public read short links"
  ON public.short_links FOR SELECT
  USING (true);

-- Users can manage their own short links
CREATE POLICY "Users insert own short links"
  ON public.short_links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own short links"
  ON public.short_links FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own short links"
  ON public.short_links FOR DELETE
  USING (user_id = auth.uid());

-- Click events for analytics
CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  user_agent text DEFAULT '',
  referrer text DEFAULT '',
  country text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_link ON public.short_link_clicks(short_link_id);

ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking redirects)
CREATE POLICY "Public insert clicks"
  ON public.short_link_clicks FOR INSERT
  WITH CHECK (true);

-- Only the link owner can read clicks
CREATE POLICY "Owners read clicks"
  ON public.short_link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.short_links sl
      WHERE sl.id = short_link_id AND sl.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- post-images bucket for social media post uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public post image access') THEN
    CREATE POLICY "Public post image access" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users upload post images') THEN
    CREATE POLICY "Auth users upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own post images') THEN
    CREATE POLICY "Users update own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post-images' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own post images') THEN
    CREATE POLICY "Users delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.role() = 'authenticated');
  END IF;
END $$;
