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
