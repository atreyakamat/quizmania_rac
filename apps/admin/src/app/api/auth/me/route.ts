import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, authenticated: false, error: auth.error },
      { status: auth.status }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: auth.user,
  });
}
