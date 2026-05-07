import { NextRequest, NextResponse } from "next/server";

import {
  createVaccinationEvent,
  getVaccinationSnapshot,
  type CreateVaccinationEventInput,
} from "@/lib/vaccination-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const snapshot = await getVaccinationSnapshot(q);

  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateVaccinationEventInput;
  const result = await createVaccinationEvent(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}