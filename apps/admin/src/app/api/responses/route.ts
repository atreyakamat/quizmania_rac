import { NextResponse } from 'next/server';
import { getResponsesPaginated } from '@quizmania/shared';
import type { ResponsesFilterParams } from '@quizmania/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 25,
      sortBy: (searchParams.get('sortBy') as any) || 'submitted_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    };

    const result = await getResponsesPaginated(filters);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching responses:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
