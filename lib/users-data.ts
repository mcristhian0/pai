import "server-only";

import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";

const ROL_LEVELS: Record<string, number> = {
  ADMIN_NAL: 5,
  ADMIN_DEP: 4,
  ADMIN_MUN: 3,
  VACUNADOR: 2,
  CONSULTA: 1,
};

type PerfilRow = {
  id_usuario: string;
  email: string | null;
  nombre: string | null;
  rol: string | null;
  codigo_departamento: string | null;
  municipio_id: string | null;
  establecimiento_id: string | null;
  activo: boolean | null;
  creado_en: string | null;
};

type CurrentUserContext = {
  userId: string;
  role: string | null;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  level: number;
  scope: string;
  status: string;
  createdAt: string;
};

export type UsersSnapshot = {
  live: boolean;
  total: number;
  items: UserListItem[];
  source: "supabase" | "fallback";
};

export type RoleOption = {
  id: string;
  name: string;
  level: number;
};

export type CreateUserInput = {
  email: string;
  name: string;
  roleId: string;
  password?: string;
  departmentId?: string;
  municipalityId?: string;
  establishmentId?: string;
};

export type UpdateUserInput = Partial<{
  name: string;
  roleId: string;
  departmentId: string;
  municipalityId: string;
  establishmentId: string;
}>;

const fallbackUsers: UserListItem[] = [
  {
    id: "fallback-user-1",
    name: "Administrador Nacional",
    email: "admin@pai.gob.bo",
    role: "ADMIN_NAL",
    level: 5,
    scope: "Nacional",
    status: "Activo",
    createdAt: "2026-05-01",
  },
];

function dateOnly(value: string | null) {
  return (value ?? "").slice(0, 10) || "-";
}

function scopeLabel(row: PerfilRow): string {
  if (row.establecimiento_id) return `Est. ${row.establecimiento_id}`;
  if (row.municipio_id) return `Mun. ${row.municipio_id}`;
  if (row.codigo_departamento) return `Dep. ${row.codigo_departamento}`;
  return "Nacional";
}

function rowToListItem(row: PerfilRow): UserListItem {
  const rol = row.rol ?? "SIN_ROL";
  return {
    id: row.id_usuario,
    name: row.nombre ?? "Sin nombre",
    email: row.email ?? "Sin email",
    role: rol,
    level: ROL_LEVELS[rol] ?? 0,
    scope: scopeLabel(row),
    status: row.activo === false ? "Inactivo" : "Activo",
    createdAt: dateOnly(row.creado_en),
  };
}

export function getRoles(): RoleOption[] {
  return [
    { id: "ADMIN_NAL", name: "ADMIN_NAL", level: 5 },
    { id: "ADMIN_DEP", name: "ADMIN_DEP", level: 4 },
    { id: "ADMIN_MUN", name: "ADMIN_MUN", level: 3 },
    { id: "VACUNADOR", name: "VACUNADOR", level: 2 },
    { id: "CONSULTA", name: "CONSULTA", level: 1 },
  ];
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user?.id) return null;

    // perfil_ver_propio policy allows each user to read their own row
    const { data } = await supabase
      .from("usuario_perfil")
      .select("id_usuario, rol, codigo_departamento, municipio_id, establecimiento_id")
      .eq("id_usuario", authData.user.id)
      .maybeSingle();

    if (!data) return { userId: authData.user.id, role: null };

    return { userId: data.id_usuario, role: data.rol ?? null };
  } catch (error) {
    console.error("Error fetching current user context:", error);
    return null;
  }
}

export async function getUsersSnapshot(search: string): Promise<UsersSnapshot> {
  // Session client — RLS filters results according to the logged-in user's scope
  const supabase = await createServerSupabaseClient();
  const query = search.trim().toLowerCase();

  const { data, error, count } = await supabase
    .from("usuario_perfil")
    .select("id_usuario, email, nombre, rol, codigo_departamento, municipio_id, establecimiento_id, activo, creado_en", { count: "exact" })
    .order("creado_en", { ascending: false })
    .limit(120);

  if (error || !data) {
    return { live: false, total: fallbackUsers.length, items: fallbackUsers, source: "fallback" };
  }

  const allItems = (data as PerfilRow[]).map(rowToListItem);

  const items = query
    ? allItems.filter((item) => {
        const haystack = `${item.name} ${item.email} ${item.role} ${item.scope}`.toLowerCase();
        return haystack.includes(query);
      })
    : allItems;

  return {
    live: true,
    total: count ?? items.length,
    items: items.slice(0, 60),
    source: "supabase",
  };
}

export async function updateUserRole(input: {
  userId: string;
  roleId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const currentUser = await getCurrentUserContext();
  const userId = input.userId.trim();
  const rol = input.roleId.trim();

  if (!userId || !rol) {
    return { ok: false, message: "Datos de actualización de rol inválidos." };
  }

  if (currentUser?.userId === userId) {
    return { ok: false, message: "No puedes cambiar tu propio rol." };
  }

  // Session client — RLS perfil_update enforces hierarchy and territory
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("usuario_perfil")
    .update({ rol })
    .eq("id_usuario", userId)
    .select("id_usuario");

  if (error) {
    return { ok: false, message: error.message || "No se pudo actualizar el rol." };
  }

  if (!data || data.length === 0) {
    return { ok: false, message: "Sin permisos para cambiar el rol de este usuario." };
  }

  return { ok: true };
}

export async function getUserDetail(userId: string): Promise<{
  user: UserListItem;
  departmentId: string | null;
  municipalityId: string | null;
  establishmentId: string | null;
} | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuario_perfil")
      .select("id_usuario, email, nombre, rol, codigo_departamento, municipio_id, establecimiento_id, activo, creado_en")
      .eq("id_usuario", userId)
      .single();

    if (error || !data) return null;

    const row = data as PerfilRow;
    return {
      user: rowToListItem(row),
      departmentId: row.codigo_departamento ?? null,
      municipalityId: row.municipio_id ?? null,
      establishmentId: row.establecimiento_id ?? null,
    };
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return null;
  }
}

export async function createUser(input: CreateUserInput): Promise<{ ok: boolean; message: string; id?: string }> {
  try {
    if (!input.password || input.password.length < 6) {
      return { ok: false, message: "La contraseña debe tener al menos 6 caracteres" };
    }

    const supabaseAdmin = createServerSupabaseAdminClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email.toLowerCase(),
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authData.user?.id) {
      console.error("auth.admin.createUser error:", JSON.stringify(authError));
      const msg = authError?.message ?? "Error creando usuario en Auth";
      if (msg.toLowerCase().includes("not allowed") || (authError as any)?.status === 403) {
        return {
          ok: false,
          message:
            "Error de autorización del servidor. Verifica que SUPABASE_SERVICE_ROLE_KEY en .env.local sea la clave 'service_role' de Supabase (no la anon key).",
        };
      }
      return { ok: false, message: msg };
    }

    const userId = authData.user.id;

    // Resolve territory fields — admin client used for reference-data lookups only
    let codigoDepartamento = input.departmentId || null;
    let municipioId = input.municipalityId || null;
    const establecimientoId = input.establishmentId || null;

    // ADMIN_MUN / VACUNADOR / CONSULTA: derive departamento from municipio
    if (["ADMIN_MUN", "VACUNADOR", "CONSULTA"].includes(input.roleId) && municipioId) {
      const { data: munData } = await supabaseAdmin
        .from("municipio")
        .select("codigo_departamento")
        .eq("municipio_id", municipioId)
        .maybeSingle();
      if (munData?.codigo_departamento) codigoDepartamento = munData.codigo_departamento;
    }

    // VACUNADOR / CONSULTA: derive municipio (and departamento) from establecimiento when municipio not provided
    if (["VACUNADOR", "CONSULTA"].includes(input.roleId) && establecimientoId && !municipioId) {
      const { data: estData } = await supabaseAdmin
        .from("establecimiento")
        .select("municipio_id")
        .eq("establecimiento_id", establecimientoId)
        .maybeSingle();
      if (estData?.municipio_id) {
        municipioId = estData.municipio_id;
        const { data: munData } = await supabaseAdmin
          .from("municipio")
          .select("codigo_departamento")
          .eq("municipio_id", municipioId)
          .maybeSingle();
        if (munData?.codigo_departamento) codigoDepartamento = munData.codigo_departamento;
      }
    }

    // Insert profile via session client so perfil_insert RLS enforces hierarchy
    const supabase = await createServerSupabaseClient();
    const { error: perfilError } = await supabase.from("usuario_perfil").insert({
      id_usuario: userId,
      email: input.email.toLowerCase(),
      nombre: input.name,
      rol: input.roleId,
      codigo_departamento: codigoDepartamento,
      municipio_id: municipioId,
      establecimiento_id: establecimientoId,
      activo: true,
    });

    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false, message: perfilError.message };
    }

    return { ok: true, message: "Usuario creado exitosamente. Ya puede iniciar sesión.", id: userId };
  } catch (error) {
    console.error("Error creating user:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error creando usuario" };
  }
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<{ ok: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUserContext();

    if (currentUser?.role === "VACUNADOR" && input.establishmentId !== undefined) {
      return { ok: false, message: "VACUNADOR no puede modificar el establecimiento de alcance." };
    }

    if (currentUser?.userId === userId && input.roleId !== undefined) {
      return { ok: false, message: "No puedes cambiar tu propio rol." };
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.nombre = input.name;
    if (input.roleId !== undefined) updates.rol = input.roleId || null;
    if (input.departmentId !== undefined) updates.codigo_departamento = input.departmentId || null;
    if (input.municipalityId !== undefined) updates.municipio_id = input.municipalityId || null;
    if (input.establishmentId !== undefined) updates.establecimiento_id = input.establishmentId || null;

    if (Object.keys(updates).length === 0) {
      return { ok: true, message: "Sin cambios." };
    }

    // Session client — RLS perfil_update enforces territory and hierarchy
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("usuario_perfil")
      .update(updates)
      .eq("id_usuario", userId)
      .select("id_usuario");

    if (error) {
      return { ok: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { ok: false, message: "Sin permisos para editar este usuario." };
    }

    return { ok: true, message: "Usuario actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating user:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error actualizando usuario" };
  }
}
