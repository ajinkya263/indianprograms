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
