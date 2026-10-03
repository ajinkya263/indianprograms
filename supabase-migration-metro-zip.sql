-- Add metro_region and zip_code columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS metro_region text NOT NULL DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS zip_code text NOT NULL DEFAULT '';

-- Index for metro region filtering
CREATE INDEX IF NOT EXISTS idx_events_metro_region ON public.events(metro_region);
CREATE INDEX IF NOT EXISTS idx_events_zip_code ON public.events(zip_code);
