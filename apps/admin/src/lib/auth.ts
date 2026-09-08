import { NextResponse } from 'next/server';

export interface AdminAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Validates administrative API requests.
 * 
 * Boundary Enforcement:
 * 1. If ADMIN_API_SECRET is configured, any caller MUST present:
 *    - Header `Authorization: Bearer <ADMIN_API_SECRET>`, or
 *    - Header `x-admin-key: <ADMIN_API_SECRET>`.
 * 2. In production (e.g. if the Admin app is ever deployed externally), ADMIN_API_SECRET
 *    is strictly mandatory. If missing or mismatched, all requests are rejected with 401.
 * 3. In development mode (local environment), loopback origins (localhost, 127.0.0.1, ::1)
 *    are permitted to facilitate local administration without breaking pairing workflows.
 * 4. Non-loopback callers in development without the secret are strictly rejected.
 */
export function validateAdminRequest(request: Request): AdminAuthResult {
  const adminSecret = process.env.ADMIN_API_SECRET;
  const authHeader = request.headers.get('authorization');
  const customKey = request.headers.get('x-admin-key');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // 1. If ADMIN_API_SECRET is provided in environment, validate it strictly
  if (adminSecret && adminSecret.trim().length > 0) {
    if (bearerToken === adminSecret || customKey === adminSecret) {
      return { authorized: true };
    }
    return { authorized: false, reason: 'Invalid or missing Admin API secret' };
  }

  // 2. In production mode, ADMIN_API_SECRET is strictly required
  if (process.env.NODE_ENV === 'production') {
    return {
      authorized: false,
      reason: 'ADMIN_API_SECRET must be configured in production environments'
    };
  }

  // 3. In local development mode, verify request originates from loopback
  const host = request.headers.get('host') || '';
  const isLoopback = host.startsWith('localhost') || 
                     host.startsWith('127.0.0.1') || 
                     host.startsWith('[::1]');

  if (isLoopback) {
    return { authorized: true };
  }

  return { authorized: false, reason: 'Unauthorized access: external caller rejected' };
}

export function unauthorizedResponse(reason?: string): NextResponse {
  return NextResponse.json(
    { success: false, error: reason || 'Unauthorized access to Admin API' },
    { status: 401 }
  );
}
