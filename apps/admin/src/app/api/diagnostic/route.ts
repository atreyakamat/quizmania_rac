import { NextResponse } from 'next/server';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Admin Diagnostic / Health Check Route.
 * Strictly protected: Requires active authenticated admin session with explicit admin_users authorization.
 * Diagnostic keys (x-diagnostic-key) are completely disabled.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  return adminJsonResponse({
    status: 'ok',
    service: 'quizmania-admin',
    healthy: true,
    timestamp: new Date().toISOString()
  }, auth);
}
