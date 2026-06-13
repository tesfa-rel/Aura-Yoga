import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | undefined;
let _supabaseAuth: SupabaseClient | undefined;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

function getSupabaseAuth(): SupabaseClient {
  if (!_supabaseAuth) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    }
    _supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAuth;
}

// Service role client for admin operations (verify tokens, create users, etc.)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return (getSupabase() as any)[prop];
  },
});

// Anon client for auth operations from the backend (signIn, signUp proxy)
export const supabaseAuth = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    return (getSupabaseAuth() as any)[prop];
  },
});
