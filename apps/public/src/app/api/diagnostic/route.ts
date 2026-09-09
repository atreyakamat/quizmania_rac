import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin, checkRateLimit, getClientIp } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

/**
 * Internal Diagnostic / Health Check Route (Public App Workspace).
 * Strictly protected: Unauthenticated public access is rejected with 401 Unauthorized.
 * Requires authenticated administrator session with explicit admin_users authorization.
 * Legacy diagnostic API keys (x-diagnostic-key) have been completely removed.
 */
export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`diag:${clientIp}`, 10, 60000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { success: false, error: 'Too many diagnostic requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 2. Administrator Authorization Guard (Uses identical admin session verification)
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error || 'Unauthorized: Diagnostic endpoint is private and requires administrator authorization.'
      },
      {
        status: auth.status,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    );
  }

  // 3. Sanitized internal health payload (zero internal paths, tokens, or configuration leaks)
  const response = NextResponse.json({
    status: 'ok',
    service: 'quizmania-public',
    timestamp: new Date().toISOString(),
    healthy: true
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}
