import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "departments";

  try {
    const admin = createServerSupabaseAdminClient();
    const supabase = await createServerSupabaseClient();

    // Para departamentos: ADMIN_NAL ve todos, otros ven su departamento
    if (type === "departments") {
      const { data, error } = await admin
        .from("departamento")
        .select("codigo_departamento, departamento_nombre")
        .order("departamento_nombre");

      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.codigo_departamento,
          name: row.departamento_nombre,
        })),
      });
    }

    // Para municipios: usar RLS para que cada rol vea lo que le corresponde
    if (type === "municipalities") {
      const { data, error } = await supabase
        .from("municipio")
        .select("municipio_id, nombre_municipio, codigo_departamento")
        .order("nombre_municipio");

      if (error) {
        console.error("Error fetching municipalities:", error);
        return NextResponse.json({ items: [], error: "Failed to fetch municipalities" }, { status: 500 });
      }

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.municipio_id,
          name: row.nombre_municipio,
        })),
      });
    }

    // Para establecimientos: usar RLS para que cada rol vea lo que le corresponde
    if (type === "establishments") {
      const { data, error } = await supabase
        .from("establecimiento")
        .select("establecimiento_id, nombre_establecimiento")
        .eq("activo", true)
        .order("nombre_establecimiento");

      if (error) {
        console.error("Error fetching establishments:", error);
        return NextResponse.json({ items: [], error: "Failed to fetch establishments" }, { status: 500 });
      }

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.establecimiento_id,
          name: row.nombre_establecimiento,
        })),
      });
    }

    return NextResponse.json({ items: [], error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/locations:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch locations" }, { status: 500 });
  }
}
