import { NextRequest, NextResponse } from "next/server";

import { updatePatient, type UpdatePatientInput } from "@/lib/patients-data";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UpdatePatientInput;

  const result = await updatePatient(id, body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
