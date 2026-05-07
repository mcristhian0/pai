import { NextRequest, NextResponse } from "next/server";

import { createPatient, getPatientsSnapshot, type CreatePatientInput } from "@/lib/patients-data";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") ?? "";
  const snapshot = await getPatientsSnapshot(search);

  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreatePatientInput;

  if (!body.ci || !body.names || !body.birthDate) {
    return NextResponse.json(
      { ok: false, message: "CI, nombres y fecha nacimiento son requeridos" },
      { status: 400 },
    );
  }

  if (!body.municipioId) {
    return NextResponse.json(
      { ok: false, message: "El municipio de residencia es requerido" },
      { status: 400 },
    );
  }

  const result = await createPatient(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}