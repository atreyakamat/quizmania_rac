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
      return NextResponse.json({ success: false, error: 'Quiz not found or not published' }, { status: 404 });
    }
    return NextResponse.json({ success: true, quiz });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error fetching quiz' },
      { status: 500 }
    );
  }
}
