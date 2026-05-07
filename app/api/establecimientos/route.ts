import { NextRequest, NextResponse } from "next/server";

import { createEstablishment, type CreateEstablishmentInput } from "@/lib/establishments-data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateEstablishmentInput;

  if (!body.code || !body.name) {
    return NextResponse.json(
      { ok: false, message: "Código y nombre son requeridos" },
      { status: 400 },
    );
  }

  const result = await createEstablishment(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
