import { NextResponse } from 'next/server';
import { getQuizById, deleteQuiz, exportQuizToJson } from '@quizmania/shared';
import { requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

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
    const { searchParams } = new URL(request.url);
    const isExport = searchParams.get('export') === 'true';

    if (isExport) {
      const exportedData = await exportQuizToJson(id);
      if (!exportedData) {
        return NextResponse.json(
          { success: false, error: 'Quiz not found for export' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: exportedData });
    }

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, quiz });
  } catch (err) {
    console.error('Error in quiz GET route:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const { id } = params;
    const success = await deleteQuiz(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Quiz could not be deleted or was not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
