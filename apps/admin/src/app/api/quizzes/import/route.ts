import { NextResponse } from 'next/server';
import { importQuizFromJson } from '@quizmania/shared';
import { validateQuizJson } from '@quizmania/quiz-schema';
import type { QuizJsonImportFormat } from '@quizmania/types';
import { requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const rawData = body.data || body;

    // If string was sent, validate and parse
    let parsedData: QuizJsonImportFormat;
    if (typeof rawData === 'string') {
      const val = validateQuizJson(rawData);
      if (!val.success || !val.data) {
        return NextResponse.json(
          { success: false, errors: val.errors || ['Invalid quiz JSON format'] },
          { status: 400 }
        );
      }
      parsedData = val.data;
    } else {
      // Validate object format
      const val = validateQuizJson(JSON.stringify(rawData));
      if (!val.success || !val.data) {
        return NextResponse.json(
          { success: false, errors: val.errors || ['Invalid quiz schema'] },
          { status: 400 }
        );
      }
      parsedData = val.data;
    }

    const createdQuiz = await importQuizFromJson(parsedData);
    return NextResponse.json({ success: true, quiz: createdQuiz });
  } catch (err) {
    console.error('Error importing quiz:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to import quiz' },
      { status: 500 }
    );
  }
}
