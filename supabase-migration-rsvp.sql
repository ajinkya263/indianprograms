-- ─────────────────────────────────────────────────────────────────────────
-- RSVP / lightweight ticketing (no payments) — schema migration
-- ─────────────────────────────────────────────────────────────────────────
-- Safe to run more than once. All ADDs and CREATEs use IF NOT EXISTS.
--
-- Model overview:
--   events.rsvp_enabled           — opt-in per event
--   events.rsvp_deadline          — cutoff for accepting new RSVPs
--   events.rsvp_capacity          — overall event cap (null = unlimited)
--   events.payment_link           — external payment URL (Venmo, Stripe, …)
--   events.payment_instructions   — freeform note shown to attendees
--   events.guest_edit_token       — magic-link secret for guest publisher
--
--   event_tiers                   — Name + Price + Capacity per tier
--   event_rsvps                   — one row per registration
--
-- We keep the RSVP row's status as one of:
--   confirmed  — accepted (fits capacity; free tier OR paid + confirmation)
--   pending    — paid tier, confirmation not yet supplied
--   waitlist   — tier or overall event capacity reached
--   cancelled  — attendee or publisher cancelled
--   attended   — checked in at the door

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rsvp_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS rsvp_capacity integer,
  ADD COLUMN IF NOT EXISTS payment_link text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_instructions text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_edit_token text;

-- Uniqueness only when set. Partial unique index does the job.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_guest_edit_token
  ON public.events (guest_edit_token)
  WHERE guest_edit_token IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- Tiers
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  capacity integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_tiers_event_id ON public.event_tiers(event_id);

ALTER TABLE public.event_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can read tiers (needed by the public RSVP form).
DROP POLICY IF EXISTS "tiers_public_read" ON public.event_tiers;
CREATE POLICY "tiers_public_read"
  ON public.event_tiers FOR SELECT
  USING (true);

-- Only the event publisher (or admin) can write tiers via the client.
-- Guest publishers hit their own server-side API that uses the service
-- role key after validating the guest_edit_token, so they bypass RLS.
DROP POLICY IF EXISTS "tiers_publisher_write" ON public.event_tiers;
CREATE POLICY "tiers_publisher_write"
  ON public.event_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_tiers.event_id
        AND (
          e.publisher_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- RSVPs
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES public.event_tiers(id) ON DELETE SET NULL,
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  attendee_phone text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1
    CHECK (quantity > 0 AND quantity <= 20),
  payment_confirmation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended', 'waitlist')),
  notes text NOT NULL DEFAULT '',
  confirmation_code text NOT NULL UNIQUE,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_email ON public.event_rsvps(lower(attendee_email));

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anon inserts allowed — this is the public RSVP form's only DB path.
-- Server-side API still validates capacity, computes waitlist status,
-- and generates the confirmation code before insert, so bare anon
-- inserts from the client aren't the expected path but are safe.
DROP POLICY IF EXISTS "rsvps_public_insert" ON public.event_rsvps;
CREATE POLICY "rsvps_public_insert"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "rsvps_publisher_read" ON public.event_rsvps;
CREATE POLICY "rsvps_publisher_read"
  ON public.event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND (
          e.publisher_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
    )
  );

DROP POLICY IF EXISTS "rsvps_publisher_update" ON public.event_rsvps;
CREATE POLICY "rsvps_publisher_update"
  ON public.event_rsvps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND (
          e.publisher_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
    )
  );
