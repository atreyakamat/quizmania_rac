import { NextResponse } from 'next/server';
import { getAllThemes, saveTheme } from '@quizmania/shared';
import type { Theme } from '@quizmania/types';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  try {
    const themes = await getAllThemes();
    return adminJsonResponse({ success: true, themes }, auth);
  } catch (err) {
    console.error('Error fetching themes:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch themes' },
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
    const themeData = (body.theme || body) as Theme;

    if (!themeData.name || !themeData.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Theme name is required' },
        { status: 400 }
      );
    }

    const savedTheme = await saveTheme(themeData);
    return adminJsonResponse({ success: true, theme: savedTheme }, auth);
  } catch (err) {
    console.error('Error saving theme:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save theme' },
      { status: 500 }
    );
  }
}
