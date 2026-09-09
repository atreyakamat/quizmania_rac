import { NextRequest, NextResponse } from 'next/server';
import { runQuizGenerationPipeline } from '@/lib/ollama/pipeline';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@quizmania/shared';

export const dynamic = 'force-dynamic';

const MAX_AI_INPUT_LENGTH = 50000;

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedAdmin(req);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(`ai:${clientIp}`, 15, 60000);
  if (!rateCheck.success) {
    return NextResponse.json(
      { success: false, error: 'Too many AI generation requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    let body: {
      input?: string;
      sourceContent?: string;
      title?: string;
      description?: string;
      instructions?: string;
      mode?: 'convert' | 'generate_from_topic' | 'add_distractors';
      stream?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    const rawContent = (body.input ?? body.sourceContent ?? '').trim();
    if (!rawContent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please paste questions and answers to generate a quiz.' 
      }, { status: 400 });
    }

    if (rawContent.length > MAX_AI_INPUT_LENGTH) {
      return NextResponse.json({
        success: false,
        error: `Input content exceeds maximum allowed length of ${MAX_AI_INPUT_LENGTH} characters.`
      }, { status: 400 });
    }


    // If client requested streaming progress updates (e.g. Admin UI)
    if (body.stream === true || req.headers.get('accept')?.includes('application/x-ndjson')) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const result = await runQuizGenerationPipeline({
              input: rawContent,
              title: body.title,
              description: body.description,
              instructions: body.instructions,
              mode: body.mode,
              onProgress: (prog) => {
                const line = JSON.stringify({ type: 'progress', ...prog }) + '\n';
                controller.enqueue(encoder.encode(line));
              }
            });

            const finalLine = JSON.stringify({
              type: result.success ? 'complete' : 'error',
              ...result
            }) + '\n';
            controller.enqueue(encoder.encode(finalLine));
            controller.close();
          } catch (err) {
            const errLine = JSON.stringify({
              type: 'error',
              success: false,
              error: err instanceof Error ? err.message : 'Unexpected server error'
            }) + '\n';
            controller.enqueue(encoder.encode(errLine));
            controller.close();
          }
        }
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Standard synchronous JSON response (e.g. test scripts, curl, external tools)
    const result = await runQuizGenerationPipeline({
      input: rawContent,
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      mode: body.mode,
    });

    if (!result.success) {
      const status = result.stage === 'validate' || result.stage === 'convert' ? 422 : 500;
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate quiz with AI',
        validationErrors: result.validationErrors
      }, { status });
    }

    return adminJsonResponse({
      success: true,
      quiz: result.data || result.quiz,
      summary: result.summary,
      json: result.json,
      questionCount: result.questionCount
    }, auth);
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected server error'
    }, { status: 500 });
  }
}
