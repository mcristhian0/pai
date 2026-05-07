import { NextRequest, NextResponse } from "next/server";

import { createUser, getUsersSnapshot, updateUserRole, type CreateUserInput } from "@/lib/users-data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const snapshot = await getUsersSnapshot(q);

  return NextResponse.json(snapshot);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { userId?: string; roleId?: string };

  const result = await updateUserRole({
    userId: body.userId ?? "",
    roleId: body.roleId ?? "",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateUserInput;

  if (!body.email || !body.name || !body.roleId) {
    return NextResponse.json(
      { ok: false, message: "Email, nombre y rol son requeridos" },
      { status: 400 },
    );
  }

  const result = await createUser(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}