import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "departments";

  try {
    const admin = createServerSupabaseAdminClient();

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

    if (type === "municipalities") {
      // Obtener perfil del usuario para filtrar por scope
      let profile: { rol: string; codigo_departamento: string | null; municipio_id: string | null; establecimiento_id: string | null } | null = null;

      try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await admin
            .from("usuario_perfil")
            .select("rol, codigo_departamento, municipio_id, establecimiento_id")
            .eq("id_usuario", user.id)
            .maybeSingle();
          profile = data;
        }
      } catch { /* sin sesión — se devuelven todos */ }

      let query = admin.from("municipio").select("municipio_id, nombre_municipio, codigo_departamento").order("nombre_municipio");

      if (profile) {
        const rol = profile.rol;
        if (rol === "ADMIN_DEP" && profile.codigo_departamento) {
          query = query.eq("codigo_departamento", profile.codigo_departamento) as typeof query;
        } else if (rol === "ADMIN_MUN" && profile.municipio_id) {
          query = query.eq("municipio_id", profile.municipio_id) as typeof query;
        } else if (rol === "VACUNADOR" && profile.establecimiento_id) {
          // Obtener el municipio del establecimiento
          const { data: est } = await admin
            .from("establecimiento")
            .select("municipio_id")
            .eq("establecimiento_id", profile.establecimiento_id)
            .maybeSingle();
          if (est?.municipio_id) {
            query = query.eq("municipio_id", est.municipio_id) as typeof query;
          }
        }
        // ADMIN_NAL y CONSULTA ven todos
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.municipio_id,
          name: row.nombre_municipio,
        })),
      });
    }

    if (type === "establishments") {
      const { data, error } = await admin
        .from("establecimiento")
        .select("establecimiento_id, nombre_establecimiento")
        .eq("activo", true)
        .order("nombre_establecimiento");

      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row: any) => ({
          id: row.establecimiento_id,
          name: row.nombre_establecimiento,
        })),
      });
    }

    return NextResponse.json({ items: [], error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch locations" }, { status: 500 });
  }
}
