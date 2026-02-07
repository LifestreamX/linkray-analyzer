import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    // Extract access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      );
    }
    // Create a Supabase client with the access token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    // Get user info from access token
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      );
    }
    const { data, error } = await supabaseAuth
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) // newest first
      .limit(10);
    if (error) {
      console.error('Error fetching recent scans:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch recent scans' },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent scans' },
      { status: 500 },
    );
  }
}
