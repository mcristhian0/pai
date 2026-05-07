import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const ci = request.nextUrl.searchParams.get("ci");

  if (!ci || ci.trim().length === 0) {
    return NextResponse.json(
      { ok: false, message: "CI es requerido" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("paciente")
      .select("paciente_id, documento_identidad, nombres, primer_apellido, segundo_apellido, genero, fecha_nacimiento")
      .eq("documento_identidad", ci.trim())
      .maybeSingle();

    if (error) {
      console.error("Error querying paciente:", error);
      return NextResponse.json(
        { ok: false, message: "Error al buscar paciente" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, message: "No se encontró paciente con ese CI" },
        { status: 404 }
      );
    }

    const fullName = [data.nombres, data.primer_apellido, data.segundo_apellido]
      .filter(Boolean)
      .join(" ") || "Paciente sin nombre";

    return NextResponse.json({
      ok: true,
      patient: {
        id: data.paciente_id,
        ci: data.documento_identidad,
        fullName,
        sex: data.genero,
        birthDate: data.fecha_nacimiento ? data.fecha_nacimiento.slice(0, 10) : "",
      },
    });
  } catch (error) {
    console.error("Error in /api/pacientes/by-ci:", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
