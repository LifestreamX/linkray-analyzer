-- Migration: Add user_id to scans table and update policies

ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);

-- Update RLS policies to restrict access to own scans only
DROP POLICY IF EXISTS "Allow public read access" ON public.scans;
CREATE POLICY "Users can read their own scans" ON public.scans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public insert access" ON public.scans;
CREATE POLICY "Users can insert their own scans" ON public.scans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Optionally, keep update/delete prevention policies as before
