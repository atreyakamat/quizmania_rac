import { NextRequest, NextResponse } from 'next/server';
import { runQuizGenerationPipeline } from '@/lib/ollama/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      input?: string;
      sourceContent?: string;
      title?: string;
      description?: string;
      instructions?: string;
      mode?: 'convert' | 'generate_from_topic' | 'add_distractors';
      stream?: boolean;
    };
    
    const rawContent = (body.input ?? body.sourceContent ?? '').trim();
    if (!rawContent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please paste questions and answers to generate a quiz.' 
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
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected server error'
    }, { status: 500 });
  }
}
