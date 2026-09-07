import { NextResponse } from 'next/server';
import {
  getSupabaseUrl,
  isSupabaseConfigured,
  isSupabaseDatabaseReady,
  getPublishedQuizzesList
} from '@quizmania/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawUrl = getSupabaseUrl();
    let hostname: string | null = null;
    try {
      hostname = new URL(rawUrl).hostname;
    } catch {
      hostname = rawUrl ? 'invalid-url' : null;
    }

    const configured = isSupabaseConfigured();
    const dbReady = await isSupabaseDatabaseReady();
    const publishedQuizzes = await getPublishedQuizzesList();

    const response = NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        configured,
        databaseReady: dbReady,
        hostname
      },
      publishedQuizzesCount: publishedQuizzes.length,
      publishedQuizzes: publishedQuizzes.map(q => ({
        id: q.id,
        title: q.title,
        slug: q.slug
      }))
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown diagnostic error'
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    );
  }
}
