-- Add submitter_email for guest submissions
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submitter_email text DEFAULT '';
