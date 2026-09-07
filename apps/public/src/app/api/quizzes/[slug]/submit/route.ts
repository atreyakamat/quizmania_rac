import { NextRequest, NextResponse } from 'next/server';
import { quizSubmissionSchema } from '@quizmania/quiz-schema';
import { scoreAndRecordQuizSubmission, getQuizAttemptByToken, updateQuizAttemptStatus } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const json = await request.json();

    const attemptId = json.attemptId;
    const sessionToken = json.sessionToken;

    if (sessionToken) {
      const attempt = await getQuizAttemptByToken(sessionToken);
      if (!attempt) {
         return NextResponse.json({ success: false, error: 'Invalid or expired session token' }, { status: 400 });
      }
      if (attempt.status === 'submitted') {
         return NextResponse.json({ success: false, error: 'Quiz already submitted for this attempt' }, { status: 400 });
      }
      /**
       * Authoritative Expiry Policy:
       * - Server-side timestamp check against attempt.expires_at.
       * - A 5,000ms (5 seconds) transport latency buffer is allowed for network transmission.
       * - Submissions received after (expires_at + 5000ms) are strictly rejected with 400 status.
       */
      const transportLatencyBufferMs = 5000;
      if (attempt.expires_at && Date.now() > new Date(attempt.expires_at).getTime() + transportLatencyBufferMs) {
         await updateQuizAttemptStatus(sessionToken, 'expired');
         return NextResponse.json({ success: false, error: 'Time expired for this attempt' }, { status: 400 });
      }
      // Update attempt status
      await updateQuizAttemptStatus(sessionToken, 'submitted', new Date().toISOString());
    }

    // 1. Validate payload with Zod
    const parsed = quizSubmissionSchema.safeParse(json);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || 'Invalid submission data',
          details: parsed.error.format()
        },
        { status: 400 }
      );
    }

    // 2. Score and record server-side
    // Passing attemptId as well if supported by schema, otherwise we just score it
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
