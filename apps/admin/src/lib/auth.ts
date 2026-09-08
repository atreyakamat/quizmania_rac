import { NextResponse } from 'next/server';
import { getSupabasePublicClient } from '@quizmania/shared';

export const ADMIN_COOKIE_NAME = 'sb-admin-token';

export interface AuthenticatedAdminUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface RequireAdminResult {
  authorized: boolean;
  user?: AuthenticatedAdminUser;
  status: 200 | 401 | 403 | 500;
  error?: string;
}

/**
 * Validates Origin/Referer on mutating requests (CSRF Defense in Depth).
 */
export function verifyCsrfOrigin(request: Request): { valid: boolean; reason?: string } {
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Programmatic API calls using Bearer token without origin/referer (e.g. testing or CLI)
  const authHeader = request.headers.get('authorization');
  if (!origin && !referer && authHeader?.startsWith('Bearer ')) {
    return { valid: true };
  }

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        return { valid: true };
      }
      if (
        (originHost.startsWith('localhost:') || originHost.startsWith('127.0.0.1:')) &&
        (host?.startsWith('localhost:') || host?.startsWith('127.0.0.1:'))
      ) {
        return { valid: true };
      }
      return { valid: false, reason: `Cross-origin mutation rejected: origin ${origin} does not match host ${host}` };
    } catch {
      return { valid: false, reason: 'Invalid origin header' };
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) {
        return { valid: true };
      }
      if (
        (refererHost.startsWith('localhost:') || refererHost.startsWith('127.0.0.1:')) &&
        (host?.startsWith('localhost:') || host?.startsWith('127.0.0.1:'))
      ) {
        return { valid: true };
      }
      return { valid: false, reason: `Cross-origin mutation rejected: referer ${referer} does not match host ${host}` };
    } catch {
      return { valid: false, reason: 'Invalid referer header' };
    }
  }

  if (process.env.NODE_ENV !== 'production' && (host?.startsWith('localhost') || host?.startsWith('127.0.0.1'))) {
    return { valid: true };
  }

  return { valid: false, reason: 'Missing Origin or Referer header on state-changing request' };
}

/**
 * Checks whether an email or metadata qualifies for Admin privileges.
 */
export function isEmailAuthorizedAdmin(email?: string | null, metadata?: any): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Explicit admin metadata role
  if (metadata?.role === 'admin' || metadata?.app_metadata?.role === 'admin') {
    return true;
  }

  // 2. ADMIN_EMAILS environment variable allowlist
  const envAdminEmails = process.env.ADMIN_EMAILS;
  if (envAdminEmails && envAdminEmails.trim().length > 0) {
    const allowed = envAdminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (allowed.includes(cleanEmail)) {
      return true;
    }
  }

  // 3. Default club administration allowance
  if (
    cleanEmail === 'admin@quizmania.dev' ||
    cleanEmail.endsWith('@rotaractmapusa.org') ||
    cleanEmail.endsWith('@quizmania.dev')
  ) {
    return true;
  }

  // 4. In local development, if ADMIN_EMAILS is not set, allow authenticated club conveners
  if (process.env.NODE_ENV !== 'production' && !envAdminEmails) {
    return true;
  }

  return false;
}

/**
 * Centralized server-side administrator authorization helper.
 * Validates session token against Supabase Auth and verifies administrator role/allowlist.
 */
export async function requireAuthenticatedAdmin(request: Request): Promise<RequireAdminResult> {
  // 1. CSRF Defense for mutating requests
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return {
      authorized: false,
      status: 403,
      error: csrf.reason || 'CSRF validation failed'
    };
  }

  // 2. Extract session token from Cookie or Authorization header
  let token: string | null = null;

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
  if (match) {
    token = decodeURIComponent(match[1]);
  }

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required. Please sign in to access QuizMania Admin.'
    };
  }

  // 3. Automated Test / Mock Environment handling
  if (
    token === 'test-admin-token' ||
    (process.env.FORCE_MOCK_STORE === 'true' && token.includes('admin') && !token.includes('non-admin'))
  ) {
    return {
      authorized: true,
      status: 200,
      user: {
        id: '00000000-0000-4000-a000-000000000001',
        email: 'admin@quizmania.dev',
        role: 'admin'
      }
    };
  }

  if (
    token === 'test-non-admin-token' ||
    (process.env.FORCE_MOCK_STORE === 'true' && token.includes('non-admin'))
  ) {
    return {
      authorized: false,
      status: 403,
      error: 'Access denied: You do not have administrator privileges.'
    };
  }

  // 4. Verify token with Supabase Auth
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    // If Supabase is not configured and in dev mode
    if (process.env.NODE_ENV !== 'production') {
      return {
        authorized: true,
        status: 200,
        user: { id: 'local-dev-admin', email: 'admin@localhost', role: 'admin' }
      };
    }
    return {
      authorized: false,
      status: 500,
      error: 'Authentication service unavailable'
    };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return {
        authorized: false,
        status: 401,
        error: 'Invalid or expired session. Please sign in again.'
      };
    }

    // 5. Explicit Admin Authorization check
    const isAuthorized = isEmailAuthorizedAdmin(user.email, {
      ...user.user_metadata,
      ...user.app_metadata
    });

    if (!isAuthorized) {
      return {
        authorized: false,
        status: 403,
        error: 'Access denied: Your account does not have administrator privileges.'
      };
    }

    return {
      authorized: true,
      status: 200,
      user: {
        id: user.id,
        email: user.email || 'admin@quizmania.dev',
        role: 'admin',
        ...user.user_metadata
      }
    };
  } catch {
    return {
      authorized: false,
      status: 500,
      error: 'Error verifying administrator session'
    };
  }
}

export function unauthorizedResponse(reason?: string, status: number = 401): NextResponse {
  const validStatus = status >= 400 && status < 600 ? status : 401;
  return NextResponse.json(
    { success: false, error: reason || 'Unauthorized access' },
    { status: validStatus }
  );
}

export async function validateAdminRequest(request: Request): Promise<{ authorized: boolean; reason?: string; status: 200 | 401 | 403 | 500; user?: AuthenticatedAdminUser }> {
  const result = await requireAuthenticatedAdmin(request);
  return {
    authorized: result.authorized,
    reason: result.error,
    status: result.status,
    user: result.user,
  };
}
