-- Migration: Add address column to events table
-- This stores the full street address of the event venue

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';

-- Add index for address searches
CREATE INDEX IF NOT EXISTS idx_events_address ON public.events(address);
