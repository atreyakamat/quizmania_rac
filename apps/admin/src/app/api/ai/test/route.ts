import { NextResponse } from 'next/server';
import { testOllamaConnection, getDefaultOllamaConfig } from '@/lib/ollama/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getDefaultOllamaConfig();
  const result = await testOllamaConnection(config);
  return NextResponse.json({ ...result, config: { model: config.model, baseUrl: config.baseUrl } });
}
