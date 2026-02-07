import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { getRecentScans } from '@/lib/supabase';

export async function GET() {
  try {
    // Create a Supabase client with the user's cookies
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      );
    }
    const scans = await getRecentScans(user.id, 10);
    return NextResponse.json({ success: true, data: scans });
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent scans' },
      { status: 500 },
    );
  }
}
