import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

export async function createServerSupabaseClient() {
  const publicEnv = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — cookie writes are a no-op here
        }
      },
    },
  });
}

export async function createServerSupabaseReadClient() {
  return createServerSupabaseClient();
}

export function createServerSupabaseAdminClient() {
  const publicEnv = getPublicEnv();
  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
