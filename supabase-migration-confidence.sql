-- ─────────────────────────────────────────────────────────────────────────
-- Confidence scoring + auto-approval — schema migration
-- ─────────────────────────────────────────────────────────────────────────
--
-- We score every crawler event on four equal-weight signals (image, date,
-- location, ticket URL) at 25% each. When an event scores 100% on two
-- independent crawls, it auto-publishes.
--
-- Columns:
--   crawler_confidence      Integer 0–100. Latest computed score.
--   confidence_details      JSON breakdown: per-signal score + why it
--                            passed or failed. Read by the admin panel.
--   confidence_100_count    How many crawls have scored this event at
--                            100%. Auto-approval fires at ≥ 2.
--   auto_approved           TRUE when the crawler auto-published it —
--                            surfaces the "Auto-approved" filter chip
--                            in the admin panel.
--   last_scored_at          Timestamp of the last scoring run. Used to
--                            prevent double-counting inside one crawl.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS crawler_confidence integer NOT NULL DEFAULT 0
    CHECK (crawler_confidence BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS confidence_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence_100_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_scored_at timestamptz;

-- Partial index so filtering auto-approved rows in the admin panel
-- stays cheap.
CREATE INDEX IF NOT EXISTS idx_events_auto_approved
  ON public.events (auto_approved, submitted_at DESC)
  WHERE auto_approved = true;

-- Also useful when sweeping the pending queue for high-confidence rows.
CREATE INDEX IF NOT EXISTS idx_events_confidence
  ON public.events (crawler_confidence DESC, status)
  WHERE source = 'crawler';
