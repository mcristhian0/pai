import { NextRequest, NextResponse } from "next/server";

import { updateUser, type UpdateUserInput } from "@/lib/users-data";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UpdateUserInput;

  const result = await updateUser(id, body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
