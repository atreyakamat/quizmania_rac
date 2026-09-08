/**
 * Lightweight, zero-dependency in-memory rate limiter for Next.js API routes.
 * Suitable for serverless / edge runtime within memory limits or long-running Node processes.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < 300000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000).unref?.();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Checks whether an action keyed by `key` (e.g. `start:${ip}`) is within `limit` over `windowMs`.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps older than the window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter(t => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetAt = oldest + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt
    };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  const resetAt = record.timestamps[0] + windowMs;

  return {
    success: true,
    limit,
    remaining,
    resetAt
  };
}

/**
 * Extracts client IP safely from request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const parts = forwardedFor.split(',');
    return parts[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}
