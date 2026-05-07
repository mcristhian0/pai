import { NextRequest, NextResponse } from "next/server";
import { updateVaccine } from "@/lib/catalog-data";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    if (!body.nombre) {
      return NextResponse.json(
        { ok: false, message: "Nombre requerido" },
        { status: 400 }
      );
    }

    const vaccine = await updateVaccine(id, {
      nombre: body.nombre,
    });

    return NextResponse.json({
      ok: true,
      message: "Vacuna actualizada",
      vaccine,
    });
  } catch (error) {
    console.error("Error updating vaccine:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Error actualizando vacuna" },
      { status: 500 }
    );
  }
}
