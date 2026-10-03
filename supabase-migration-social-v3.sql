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
