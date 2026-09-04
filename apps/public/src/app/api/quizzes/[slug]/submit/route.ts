import { NextRequest, NextResponse } from 'next/server';
import { quizSubmissionSchema } from '@quizmania/quiz-schema';
import { scoreAndRecordQuizSubmission } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const json = await request.json();

    // 1. Validate payload with Zod
    const parsed = quizSubmissionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid submission data',
          details: parsed.error.format()
        },
        { status: 400 }
      );
    }

    // 2. Score and record server-side
    const outcome = await scoreAndRecordQuizSubmission(params.slug, parsed.data);

    if (!outcome.success) {
      return NextResponse.json(
        { success: false, error: outcome.error },
        { status: 400 }
      );
    }

    // 3. Return sanitized result
    return NextResponse.json({
      success: true,
      result: outcome.result
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Server error scoring submission'
      },
      { status: 500 }
    );
  }
}
