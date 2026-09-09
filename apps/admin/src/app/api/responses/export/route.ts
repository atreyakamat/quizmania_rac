import { exportResponsesCsv } from '@quizmania/shared';
import type { ResponsesFilterParams } from '@quizmania/types';
import { attachSessionCookies, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

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

    const csvData = await exportResponsesCsv(filters);
    const filename = `quizmania-responses-${new Date().toISOString().slice(0, 10)}.csv`;

    const response = new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

    if (auth.refreshedTokens) {
      const nextResponse = new (await import('next/server')).NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
      return attachSessionCookies(nextResponse, auth.refreshedTokens);
    }

    return response;
  } catch (err) {
    console.error('Error exporting responses CSV:', err);
    return new Response('Failed to export responses', { status: 500 });
  }
}
