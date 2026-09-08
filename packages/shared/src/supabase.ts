import { createClient, SupabaseClient } from '@supabase/supabase-js';

let publicClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://eaqmwvxggnyprletpklr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcW13dnhnZ255cHJsZXRwa2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDgyOTgsImV4cCI6MjEwNDA4NDI5OH0._2JAhfvsSg1WkWQmueSFjul0NBeDqxpF3h--DFyo2Uc';

export function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (envUrl && !envUrl.includes('placeholder') && !envUrl.includes('your-supabase-url')) {
    return envUrl;
  }
  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (envKey && !envKey.includes('placeholder') && !envKey.includes('your-supabase-key')) {
    return envKey;
  }
  return DEFAULT_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceKey(): string | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    envKey &&
    !envKey.includes('placeholder') &&
    !envKey.includes('your-service-role') &&
    !envKey.includes('your_service_role')
  ) {
    return envKey;
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return Boolean(url && anonKey && !url.includes('placeholder'));
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
    const anonKey = getSupabaseAnonKey();
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
  const anonKey = getSupabaseAnonKey();
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

