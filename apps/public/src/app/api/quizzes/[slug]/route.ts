import { NextRequest, NextResponse } from 'next/server';
import { getPublishedQuizBySlug } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const quiz = await getPublishedQuizBySlug(params.slug);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found or not published' },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
        }
      );
    }
    const response = NextResponse.json({ success: true, quiz });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error fetching quiz' },
      { status: 500 }
    );
  }
}
