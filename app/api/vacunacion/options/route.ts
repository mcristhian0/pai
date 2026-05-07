import { NextResponse } from "next/server";

import { getVaccinationOptions } from "@/lib/vaccination-data";

export async function GET() {
  const options = await getVaccinationOptions();
  return NextResponse.json(options);
}