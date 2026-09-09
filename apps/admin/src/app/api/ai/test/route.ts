import { NextRequest, NextResponse } from 'next/server';
import { testOllamaConnection, getDefaultOllamaConfig } from '@/lib/ollama/service';
import { adminJsonResponse, requireAuthenticatedAdmin, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error, auth.status);
  }

  const config = getDefaultOllamaConfig();
  const result = await testOllamaConnection(config);
  return adminJsonResponse({
    ...result,
    config: {
      model: config.model,
      enabled: config.enabled
    }
  }, auth);
}

