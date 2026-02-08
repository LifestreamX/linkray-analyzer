-- Migration: Allow upsert on (user_id, url_hash) combination
-- This allows each user to have their own scan history for the same URL
-- and ensures that re-scanning the same URL updates the existing record

-- Drop the old unique constraint on url_hash only
ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_url_hash_key;

-- Add a unique constraint on (user_id, url_hash) combination
ALTER TABLE public.scans ADD CONSTRAINT scans_user_url_unique UNIQUE (user_id, url_hash);

-- Update the policy to allow updates for authenticated users on their own scans
DROP POLICY IF EXISTS "Prevent updates" ON public.scans;
CREATE POLICY "Users can update their own scans" ON public.scans
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
