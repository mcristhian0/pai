import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { ok: false, message: "La gestión de dosis se hace a través de las vacunas" },
    { status: 410 },
  );
}
