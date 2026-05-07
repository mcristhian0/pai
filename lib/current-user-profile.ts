import "server-only";

import { createServerSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";

export type CurrentUserProfile = {
  id: string;
  email: string;
  name: string;
  roleName: string;
  roleLevel: number;
  scope: string;
  active: boolean;
};

const ROL_LEVELS: Record<string, number> = {
  ADMIN_NAL: 5,
  ADMIN_DEP: 4,
  ADMIN_MUN: 3,
  VACUNADOR: 2,
  CONSULTA: 1,
};

type PerfilRow = {
  nombre: string | null;
  email: string | null;
  rol: string | null;
  codigo_departamento: string | null;
  municipio_id: string | null;
  establecimiento_id: string | null;
  activo: boolean | null;
};

function formatScope(row: PerfilRow): string {
  if (row.establecimiento_id) return `Establecimiento ${row.establecimiento_id}`;
  if (row.municipio_id) return `Municipio ${row.municipio_id}`;
  if (row.codigo_departamento) return `Departamento ${row.codigo_departamento}`;
  return "Nacional";
}

export async function getCurrentUserProfile(userId: string, fallbackEmail: string | null): Promise<CurrentUserProfile | null> {
  // Try session-based client first (uses RLS perfil_self policy — no admin key needed)
  let supabase = await createServerSupabaseClient();
  let { data, error } = await supabase
    .from("usuario_perfil")
    .select("nombre, email, rol, codigo_departamento, municipio_id, establecimiento_id, activo")
    .eq("id_usuario", userId)
    .maybeSingle();

  // Fall back to admin client if session client returned nothing (e.g. new session, no RLS match)
  if (!data && !error) {
    const adminClient = createServerSupabaseAdminClient();
    const result = await adminClient
      .from("usuario_perfil")
      .select("nombre, email, rol, codigo_departamento, municipio_id, establecimiento_id, activo")
      .eq("id_usuario", userId)
      .maybeSingle();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Error al leer usuario_perfil:", error.code, error.message, error.details);
  }

  if (!data) {
    console.warn(`Sin perfil en usuario_perfil para id_usuario=${userId}. Verifica el INSERT en bd.sql.`);
    return null;
  }

  const row = data as PerfilRow;
  const email = row.email ?? fallbackEmail ?? "Usuario autenticado";
  const rol = row.rol ?? "SIN_ROL";

  return {
    id: userId,
    email,
    name: row.nombre?.trim() || email,
    roleName: rol,
    roleLevel: ROL_LEVELS[rol] ?? 0,
    scope: formatScope(row),
    active: row.activo !== false,
  };
}
