import { NextResponse } from 'next/server';
import { getRecentScans } from '@/lib/supabase';

export async function GET() {
  try {
    const scans = await getRecentScans(5);
    return NextResponse.json({ success: true, data: scans });
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent scans' },
      { status: 500 },
    );
  }
}
