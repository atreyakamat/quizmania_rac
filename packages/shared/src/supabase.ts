import { createClient, SupabaseClient } from '@supabase/supabase-js';

let publicClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://eaqmwvxggnyprletpklr.supabase.co';

function parseEnvLines(content: string): void {
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function findEnvLocalPath(fs: any, path: any): string | null {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../../.env.local'),
    path.resolve(__dirname, '../../../.env.local'),
    path.resolve(__dirname, '../../../../.env.local')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadEnvIfAvailable(): void {
  if (typeof window !== 'undefined') return;
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  try {
    const req = typeof (globalThis as any).__non_webpack_require__ !== 'undefined'
      ? (globalThis as any).__non_webpack_require__
      : eval('require');
    const fs = req('fs');
    const path = req('path');
    const envFile = findEnvLocalPath(fs, path);
    if (envFile) {
      parseEnvLines(fs.readFileSync(envFile, 'utf8'));
    }
  } catch {}
}

export function getSupabaseUrl(): string {
  loadEnvIfAvailable();
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (envUrl && !envUrl.includes('placeholder') && !envUrl.includes('your-supabase-url') && !envUrl.includes('your-project')) {
    return envUrl;
  }
  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | null {
  loadEnvIfAvailable();
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (
    envKey &&
    !envKey.includes('placeholder') &&
    !envKey.includes('your-supabase-key') &&
    !envKey.includes('your-anon-public-key') &&
    !envKey.includes('your_supabase_publishable_key')
  ) {
    return envKey;
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test-publishable-key';
  }
  return null;
}

export function getSupabaseServiceKey(): string | null {
  if (typeof window !== 'undefined') {
    // Hard security boundary: Service role key MUST NEVER be accessible on the client side
    return null;
  }
  loadEnvIfAvailable();
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (
    envKey &&
    !envKey.includes('placeholder') &&
    !envKey.includes('your-service-role') &&
    !envKey.includes('your_service_role') &&
    !envKey.includes('your_supabase_service_role_key')
  ) {
    return envKey;
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return Boolean(url && anonKey && !url.includes('placeholder') && !url.includes('your-project'));
}

export function resetSupabaseClients(): void {
  publicClientInstance = null;
  adminClientInstance = null;
  dbReadyCache = null;
}

export function isSupabaseAdminConfigured(): boolean {
  if (typeof window !== 'undefined') {
    return false;
  }
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  return Boolean(url && serviceKey && !url.includes('placeholder'));
}

/**
 * Public Supabase client using Anon Key.
 * Subject to Row-Level Security (RLS).
 * Configured with cache: 'no-store' to guarantee fresh data on every query.
 */
export function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!publicClientInstance) {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey()!;
    publicClientInstance = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: {
        fetch: (fetchUrl, options = {}) => {
          return fetch(fetchUrl, {
            ...options,
            cache: 'no-store'
          });
        }
      }
    });
  }
  return publicClientInstance;
}

/**
 * Admin Supabase client using Service Role Key.
 * Bypasses RLS for secure server-side scoring & local admin app.
 * NEVER expose this client to the public browser client!
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    // Hard security guarantee: Service role client must never be instantiated in browser
    return null;
  }
  if (!isSupabaseAdminConfigured()) {
    return null;
  }
  if (!adminClientInstance) {
    const url = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceKey()!;
    adminClientInstance = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
      global: {
        fetch: (fetchUrl, options = {}) => {
          return fetch(fetchUrl, {
            ...options,
            cache: 'no-store'
          });
        }
      }
    });
  }
  return adminClientInstance;
}

/**
 * Authenticated Supabase client using user access token.
 * Subject to Row-Level Security (RLS) under the authenticated user's identity.
 * Does NOT use service-role key. Safe for authenticated user requests.
 */
export function getSupabaseAuthenticatedClient(accessToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured() || !accessToken) {
    return null;
  }
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey()!;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      fetch: (fetchUrl, options = {}) => {
        return fetch(fetchUrl, {
          ...options,
          cache: 'no-store'
        });
      }
    }
  });
}

let dbReadyCache: { ready: boolean; timestamp: number } | null = null;

/**
 * Verifies that Supabase is both configured and has the required database schema (public.quizzes table) available.
 */
export async function isSupabaseDatabaseReady(): Promise<boolean> {
  if (process.env.FORCE_MOCK_STORE === 'true') {
    return false;
  }
  if (!isSupabaseAdminConfigured() && !isSupabaseConfigured()) {
    return false;
  }

  const now = Date.now();
  if (dbReadyCache && now - dbReadyCache.timestamp < 5000) {
    return dbReadyCache.ready;
  }

  const supabase = getSupabaseAdminClient() || getSupabasePublicClient();
  if (!supabase) {
    dbReadyCache = { ready: false, timestamp: now };
    return false;
  }

  try {
    const { error } = await supabase.from('quizzes').select('id').limit(1);
    if (!error) {
      dbReadyCache = { ready: true, timestamp: now };
      return true;
    }
    dbReadyCache = { ready: false, timestamp: now };
    return false;
  } catch {
    dbReadyCache = { ready: false, timestamp: now };
    return false;
  }
}

/**
 * Returns deterministic active storage mode and human-readable explanation.
 */
export async function getDatabaseStatus(): Promise<{
  mode: 'supabase' | 'mock';
  configured: boolean;
  ready: boolean;
  message: string;
}> {
  const configured = isSupabaseConfigured() || isSupabaseAdminConfigured();
  if (!configured) {
    return {
      mode: 'mock',
      configured: false,
      ready: false,
      message: 'Standalone Mock Mode (no Supabase credentials in .env)'
    };
  }

  const ready = await isSupabaseDatabaseReady();
  if (ready) {
    return {
      mode: 'supabase',
      configured: true,
      ready: true,
      message: 'Supabase PostgreSQL (Live Database Connected)'
    };
  }

  return {
    mode: 'mock',
    configured: true,
    ready: false,
    message: 'Mock Store Active: Supabase credentials found, but schema tables are not yet created in the database. Run supabase/schema.sql in Supabase SQL Editor.'
  };
}

