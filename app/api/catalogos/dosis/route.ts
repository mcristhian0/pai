import { NextResponse } from "next/server";
import { getDosesSnapshot } from "@/lib/catalog-data";

export async function GET() {
  const snapshot = await getDosesSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "La gestión de dosis se hace a través de las vacunas (campo número de dosis)" },
    { status: 410 },
  );
}
