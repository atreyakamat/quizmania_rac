import { NextResponse } from 'next/server';
import { exportQuizToJson } from '@quizmania/shared';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const { id } = params;
    const data = await exportQuizToJson(id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }
    return adminJsonResponse({ success: true, data }, auth);
  } catch (err) {
    console.error('Error exporting quiz:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
