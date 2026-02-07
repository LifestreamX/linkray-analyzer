import { createClient } from '@supabase/supabase-js';
import type { Scan } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export async function getCachedScan(urlHash: string): Promise<Scan | null> {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('url_hash', urlHash)
    .gte('created_at', twentyFourHoursAgo)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Scan;
}

export async function saveScan(
  scan: Omit<Scan, 'id' | 'created_at'>,
): Promise<Scan | null> {
  const { data, error } = await supabase
    .from('scans')
    .insert(scan)
    .select()
    .single();

  if (error) {
    console.error('Error saving scan:', error);
    return null;
  }

  return data as Scan;
}

export async function getRecentScans(limit: number = 3): Promise<Scan[]> {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as Scan[];
}
