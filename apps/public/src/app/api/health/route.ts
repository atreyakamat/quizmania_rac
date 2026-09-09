import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Minimal Public Health Check Endpoint.
 * Intentionally public for platform deployment health probes, load balancer liveness checks, and uptime monitoring.
 * Exposes strictly minimal health status without revealing Supabase hostnames, database connection details,
 * environment variables, internal identifiers, or stack traces.
 */
export async function GET() {
  const response = NextResponse.json({
    status: 'ok',
    service: 'quizmania-public',
    healthy: true,
    timestamp: new Date().toISOString()
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}
