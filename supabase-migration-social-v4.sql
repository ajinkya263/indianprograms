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
