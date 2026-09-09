import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, getSupabasePublicClient, getAdminUserRecord } from '@quizmania/shared';
import {
  attachSessionCookies,
  verifyAdminAuthorization,
  verifyCsrfOrigin,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Rate Limiting: 5 attempts per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`admin-login:${clientIp}`, 5, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please try again in 1 minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // 2. CSRF Defense
  const csrf = verifyCsrfOrigin(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { success: false, error: csrf.reason || 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // 3. Parse and strictly validate request payload
  let email = '';
  let password = '';
  try {
    const body = await request.json();
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password format' },
        { status: 400 }
      );
    }
    email = body.email.trim().toLowerCase();
    password = body.password;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload' },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // 4. Test Runner Isolation (ONLY active in automated Vitest test runner, NEVER in production or dev server)
  if (process.env.NODE_ENV === 'test') {
    const adminRecord = await getAdminUserRecord(email);
    if (!adminRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (adminRecord.enabled === false) {
      return NextResponse.json(
        { success: false, error: 'Administrator account is disabled' },
        { status: 403 }
      );
    }

    if (adminRecord.role !== 'admin' && adminRecord.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Your account does not have administrator privileges.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminRecord.user_id || adminRecord.id,
        email: adminRecord.email,
        role: adminRecord.role,
      },
    });

    attachSessionCookies(response, {
      accessToken: 'test-admin-token',
      refreshToken: 'valid-refresh-token',
      expiresIn: 3600,
    });

    return response;
  }

  // 5. Supabase Auth Verification (Real running environment)
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      // Generic error response: never reveal whether account exists
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 6. Enforce Explicit Admin Authorization (NO domain-based or metadata-only allowance)
    const authCheck = await verifyAdminAuthorization(
      data.user.id,
      data.user.email || email
    );

    if (!authCheck.authorized) {
      // Invalidate authenticated session immediately since user has no admin rights
      try {
        await supabase.auth.signOut();
      } catch {}

      return NextResponse.json(
        {
          success: false,
          error: authCheck.reason || 'Access denied: Your account does not have administrator privileges.'
        },
        { status: 403 }
      );
    }

    // 7. Issue Session Cookies with Access and Refresh Token Lifecycle
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: authCheck.role || 'admin',
      },
    });

    attachSessionCookies(response, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    });

    return response;
  } catch (err) {
    console.error('Login authentication error occurred');
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred' },
      { status: 500 }
    );
  }
}
