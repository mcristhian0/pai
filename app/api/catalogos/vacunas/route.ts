import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createVaccine, getVaccinesSnapshot } from "@/lib/catalog-data";

export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list") === "true";

  try {
    if (list) {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("vacuna")
        .select("vacuna_id, vacuna_nombre")
        .order("vacuna_nombre", { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.vacuna_id,
          code: row.vacuna_id,
          name: row.vacuna_nombre,
        })),
      });
    }

    const query = request.nextUrl.searchParams.get("q") ?? "";
    const snapshot = await getVaccinesSnapshot(query);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Error fetching vaccines:", error);
    return NextResponse.json({ items: [], total: 0, live: false, source: "fallback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.cod_vacuna || !body.nombre) {
      return NextResponse.json(
        { ok: false, message: "Código y nombre requeridos" },
        { status: 400 }
      );
    }

    const vaccine = await createVaccine({
      cod_vacuna: body.cod_vacuna,
      nombre: body.nombre,
      numero_dosis: body.numero_dosis ? Number(body.numero_dosis) : 1,
    });

    return NextResponse.json({
      ok: true,
      message: "Vacuna creada",
      vaccine,
    });
  } catch (error) {
    console.error("Error creating vaccine:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Error creando vacuna" },
      { status: 500 }
    );
  }
}
