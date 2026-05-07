import { NextRequest, NextResponse } from "next/server";

import { updateEstablishment, type UpdateEstablishmentInput } from "@/lib/establishments-data";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UpdateEstablishmentInput;

  const result = await updateEstablishment(id, body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
