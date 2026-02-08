-- LinkRay Supabase Schema (2026)
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Main scans table
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  url_hash text not null,
  url text not null,
  summary text not null,
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  reason text not null,
  category text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  constraint scans_user_url_unique unique (user_id, url_hash)
);

-- Indexes for performance
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scans_url_hash on public.scans(url_hash);
create index if not exists idx_scans_created_at on public.scans(created_at desc);

-- Enable Row Level Security
alter table public.scans enable row level security;

-- RLS: Only allow users to read/insert their own scans
create policy "Users can read their own scans" on public.scans
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own scans" on public.scans
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Prevent updates and deletes (immutable cache)
create policy "Prevent updates" on public.scans
  for update to authenticated
  using (false);

create policy "Prevent deletes" on public.scans
  for delete to authenticated
  using (false);
