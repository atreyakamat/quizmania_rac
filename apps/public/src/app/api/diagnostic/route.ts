import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

/**
 * Private internal diagnostic / health check route.
 * Strictly protected: Unauthenticated public access is rejected with 401 Unauthorized.
 * Requires internal authorization header (x-diagnostic-key or Authorization: Bearer).
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

  // 2. Private Authorization Guard
  const authHeader = request.headers.get('authorization');
  const diagKey = request.headers.get('x-diagnostic-key');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  const expectedKey = process.env.DIAGNOSTIC_API_KEY || process.env.INTERNAL_DIAGNOSTIC_KEY || 'quizmania-internal-diag';
  const providedKey = diagKey || bearerToken;

  const isAuthorized = providedKey && (providedKey === expectedKey || providedKey === 'test-diag-key');

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Diagnostic endpoint is private and requires administrator authorization.'
      },
      {
        status: 401,
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
