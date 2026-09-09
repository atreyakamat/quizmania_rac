import { NextResponse } from 'next/server';
import { setQuizStatus } from '@quizmania/shared';
import type { QuizStatus } from '@quizmania/types';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body as { status: QuizStatus };

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing status. Must be draft, published, or archived.' },
        { status: 400 }
      );
    }

    const updatedQuiz = await setQuizStatus(id, status);
    if (!updatedQuiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found or could not update status' },
        { status: 404 }
      );
    }

    return adminJsonResponse({ success: true, quiz: updatedQuiz }, auth);
  } catch (err) {
    console.error('Error setting quiz status:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update quiz status' },
      { status: 500 }
    );
  }
}
