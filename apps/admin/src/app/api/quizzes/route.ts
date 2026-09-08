import { NextResponse } from 'next/server';
import { getAllQuizzes, saveQuiz } from '@quizmania/shared';
import type { Quiz, QuizStatus } from '@quizmania/types';
import { requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as QuizStatus | null;
    const quizzes = await getAllQuizzes(status || undefined);
    return NextResponse.json({ success: true, quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const quizData = (body.quiz || body) as Quiz;

    if (!quizData.title || !quizData.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Quiz title is required' },
        { status: 400 }
      );
    }

    if (!quizData.slug || !quizData.slug.trim()) {
      return NextResponse.json(
        { success: false, error: 'Quiz slug is required' },
        { status: 400 }
      );
    }

    const savedQuiz = await saveQuiz(quizData);
    return NextResponse.json({ success: true, quiz: savedQuiz });
  } catch (err) {
    console.error('Error saving quiz:', err);
    const msg = err instanceof Error ? err.message : 'Failed to save quiz';
    const isValidationErr = msg.includes('End time must be later than start time') || msg.includes('Invalid date');
    return NextResponse.json(
      { success: false, error: msg },
      { status: isValidationErr ? 400 : 500 }
    );
  }
}
