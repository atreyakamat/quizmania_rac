import { NextResponse } from 'next/server';
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_LEGACY_COOKIE,
  ADMIN_COOKIE_NAME,
  AuthenticatedAdminUser,
  SessionTokens,
  RequireAdminResult,
  getSupabaseProjectRef,
  getAdminCookieOptions,
  getSafeRedirectUrl,
  verifyCsrfOrigin,
  verifyAdminAuthorization,
  requireAuthenticatedAdmin
} from '@quizmania/shared';

// Re-export all core auth items
export {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_LEGACY_COOKIE,
  ADMIN_COOKIE_NAME,
  getSupabaseProjectRef,
  getAdminCookieOptions,
  getSafeRedirectUrl,
  verifyCsrfOrigin,
  verifyAdminAuthorization,
  requireAuthenticatedAdmin
};
export type { AuthenticatedAdminUser, SessionTokens, RequireAdminResult };

/**
 * Attaches both access and refresh cookies to a NextResponse.
 */
export function attachSessionCookies(response: NextResponse, tokens: SessionTokens, forceSecure?: boolean): NextResponse {
  const cookieOptsAccess = getAdminCookieOptions('access', tokens.expiresIn, forceSecure);
  const cookieOptsRefresh = getAdminCookieOptions('refresh', undefined, forceSecure);

  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE,
    value: tokens.accessToken,
    ...cookieOptsAccess
  });
  // Maintain legacy cookie name for backwards compatibility
  response.cookies.set({
    name: ADMIN_LEGACY_COOKIE,
    value: tokens.accessToken,
    ...cookieOptsAccess
  });
  if (tokens.refreshToken) {
    response.cookies.set({
      name: ADMIN_REFRESH_COOKIE,
      value: tokens.refreshToken,
      ...cookieOptsRefresh
    });
    // Set standard Supabase SSR session format cookie sb-<ref>-auth-token
    const ref = getSupabaseProjectRef();
    if (ref) {
      try {
        const sessionPayload = JSON.stringify([tokens.accessToken, tokens.refreshToken]);
        response.cookies.set({
          name: `sb-${ref}-auth-token`,
          value: sessionPayload,
          ...cookieOptsRefresh
        });
      } catch {
        // Safe fallback
      }
    }
  }
  return response;
}

/**
 * Clears all admin session cookies upon logout or session invalidation.
 */
export function clearSessionCookies(response: NextResponse, forceSecure?: boolean): NextResponse {
  const isProd = forceSecure !== undefined ? forceSecure : (process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
  const expiredOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  };
  response.cookies.set({ name: ADMIN_ACCESS_COOKIE, value: '', ...expiredOpts });
  response.cookies.set({ name: ADMIN_REFRESH_COOKIE, value: '', ...expiredOpts });
  response.cookies.set({ name: ADMIN_LEGACY_COOKIE, value: '', ...expiredOpts });
  const ref = getSupabaseProjectRef();
  if (ref) {
    response.cookies.set({ name: `sb-${ref}-auth-token`, value: '', ...expiredOpts });
  }
  return response;
}

/**
 * Standard unauthorized JSON response.
 */
export function unauthorizedResponse(reason?: string, status: number = 401): NextResponse {
  const validStatus = status >= 400 && status < 600 ? status : 401;
  return NextResponse.json(
    { success: false, error: reason || 'Unauthorized access' },
    { status: validStatus }
  );
}

/**
 * Centralized admin JSON response builder.
 * Automatically attaches renewed session cookies whenever requireAuthenticatedAdmin
 * performed a transparent session refresh.
 */
export function adminJsonResponse(
  data: any,
  authResult?: RequireAdminResult | null,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init);
  if (authResult?.refreshedTokens) {
    attachSessionCookies(response, authResult.refreshedTokens);
  }
  return response;
}

export async function validateAdminRequest(request: Request): Promise<{
  authorized: boolean;
  reason?: string;
  status: 200 | 401 | 403 | 500;
  user?: AuthenticatedAdminUser;
}> {
  const result = await requireAuthenticatedAdmin(request);
  return {
    authorized: result.authorized,
    reason: result.error,
    status: result.status,
    user: result.user,
  };
}
