import { NextRequest, NextResponse } from "next/server";

import { getAuditSnapshot } from "@/lib/audit-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const snapshot = await getAuditSnapshot(q);

  return NextResponse.json(snapshot);
}