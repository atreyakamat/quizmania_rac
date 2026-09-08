import { NextResponse } from 'next/server';
import { attachSessionCookies, requireAuthenticatedAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, authenticated: false, error: auth.error },
      { status: auth.status }
    );
  }

  const response = NextResponse.json({
    success: true,
    authenticated: true,
    user: auth.user,
  });

  // If session was refreshed during validation, attach updated cookies
  if (auth.refreshedTokens) {
    attachSessionCookies(response, auth.refreshedTokens);
  }

  return response;
}
