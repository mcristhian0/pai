import { NextResponse } from "next/server";

import { getPublicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

export function GET() {
  const publicEnv = getPublicEnv();
  return NextResponse.json({
    ok: true,
    backend: "supabase",
    configured: {
      url: Boolean(publicEnv.supabaseUrl),
      anonKey: Boolean(publicEnv.supabaseAnonKey),
      serviceRoleKey: Boolean(serverEnv.supabaseServiceRoleKey),
    },
  });
}