import { NextResponse } from 'next/server';
import { getResponseDetail, updateManualGrade } from '@quizmania/shared';
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
    const detail = await getResponseDetail(params.id);
    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }
    return adminJsonResponse({ success: true, ...detail }, auth);
  } catch (err) {
    console.error(`Error fetching submission ${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const { questionId, earnedMarks } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    if (earnedMarks === undefined || earnedMarks === null || isNaN(Number(earnedMarks))) {
      return NextResponse.json(
        { success: false, error: 'Valid earned marks must be provided' },
        { status: 400 }
      );
    }

    const result = await updateManualGrade(params.id, questionId, Number(earnedMarks));
    return adminJsonResponse(result, auth);
  } catch (err) {
    console.error(`Error updating grade for submission ${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update grade' },
      { status: 500 }
    );
  }
}
