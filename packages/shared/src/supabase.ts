import { createClient, SupabaseClient } from '@supabase/supabase-js';

let publicClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && !url.includes('placeholder') && !url.includes('your-supabase-url'));
}

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && !url.includes('placeholder') && !serviceKey.includes('placeholder'));
}

/**
 * Public Supabase client using Anon Key.
 * Subject to Row-Level Security (RLS).
 */
export function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!publicClientInstance) {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!;
    publicClientInstance = createClient(url, anonKey, {
      auth: { persistSession: false }
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
    const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    adminClientInstance = createClient(url, serviceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return adminClientInstance;
}

let dbReadyCache: { ready: boolean; timestamp: number } | null = null;

/**
 * Verifies that Supabase is both configured and has the required database schema (public.quizzes table) available.
 */
export async function isSupabaseDatabaseReady(): Promise<boolean> {
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

