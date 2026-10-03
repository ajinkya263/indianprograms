-- Add rejection_feedback column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS rejection_feedback text DEFAULT '';
