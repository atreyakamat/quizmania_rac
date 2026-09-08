import { NextResponse } from 'next/server';
import { clearSessionCookies, verifyCsrfOrigin } from '@/lib/auth';
import { getSupabasePublicClient } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. CSRF Defense
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { success: false, error: csrf.reason || 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // 2. Invalidate session upstream in Supabase Auth if accessible
  try {
    const supabase = getSupabasePublicClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {
    // Session cleanup continues even if upstream call fails
  }

  // 3. Clear all admin session cookies
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  return clearSessionCookies(response);
}
