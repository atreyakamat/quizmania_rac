import { NextRequest, NextResponse } from 'next/server';
import { testOllamaConnection, getDefaultOllamaConfig } from '@/lib/ollama/service';
import { validateAdminRequest, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = validateAdminRequest(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.reason);
  }

  const config = getDefaultOllamaConfig();
  const result = await testOllamaConnection(config);
  return NextResponse.json({
    ...result,
    config: {
      model: config.model,
      enabled: config.enabled
    }
  });
}

