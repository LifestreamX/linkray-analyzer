-- LinkRay Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create the scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url_hash TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    summary TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on url_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_scans_url_hash ON public.scans(url_hash);

-- Create an index on created_at for recent scans queries
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access
CREATE POLICY "Allow public read access" 
ON public.scans 
FOR SELECT 
TO public 
USING (true);

-- Create a policy for public insert access (needed for API to write)
CREATE POLICY "Allow public insert access" 
ON public.scans 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Optional: Create a policy to prevent updates/deletes (cache is immutable)
CREATE POLICY "Prevent updates" 
ON public.scans 
FOR UPDATE 
TO public 
USING (false);

CREATE POLICY "Prevent deletes" 
ON public.scans 
FOR DELETE 
TO public 
USING (false);
