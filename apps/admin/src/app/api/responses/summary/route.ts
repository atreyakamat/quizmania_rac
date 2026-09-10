import { NextResponse } from 'next/server';
import { getClubSummary } from '@quizmania/shared';
import type { ResponsesFilterParams } from '@quizmania/types';
import { attachSessionCookies, requireAuthenticatedAdmin, unauthorizedResponse } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const { searchParams } = new URL(request.url);

    const filters: ResponsesFilterParams = {
      search: searchParams.get('search') || undefined,
      quizId: searchParams.get('quizId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
      maxScore: searchParams.get('maxScore') ? Number(searchParams.get('maxScore')) : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'submitted_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    };

    const summary = await getClubSummary(filters);

    const response = NextResponse.json({
      success: true,
      summary
    });

    if (auth.refreshedTokens) {
      return attachSessionCookies(response, auth.refreshedTokens);
    }

    return response;
  } catch (err) {
    console.error('Error generating club summary:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate club summary' }, { status: 500 });
  }
}
