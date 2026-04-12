import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return createClient(url, anonKey);
}

export function createSupabaseAdminClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
