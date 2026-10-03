-- Add source column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'crawler'));

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(source);
