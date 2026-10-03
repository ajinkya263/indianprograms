-- Add language field to events so guest submissions can require it and
-- crawler rows can prefill it when detectable from title/description.
--
-- Safe to run more than once — the IF NOT EXISTS guards.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS language text DEFAULT '';

-- Index to make language filtering on the homepage cheap.
CREATE INDEX IF NOT EXISTS idx_events_language
  ON public.events (language)
  WHERE language <> '';
