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
