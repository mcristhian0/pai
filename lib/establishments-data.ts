import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EstablishmentListItem = {
  id: string;
  code: string;
  name: string;
  municipality: string;
  type: string;
  level: string;
};

export type EstablishmentDetail = {
  id: string;
  code: string;
  name: string;
  type: string;
  level: string;
  networkHealth: string;
  municipalityId: string;
  latitude: string;
  longitude: string;
};

export type EstablishmentsSnapshot = {
  live: boolean;
  total: number;
  items: EstablishmentListItem[];
  source: "supabase" | "fallback";
};

export type CreateEstablishmentInput = {
  code: string;
  name: string;
  type: string;
  level: string;
  networkHealth: string;
  municipalityId: string;
  latitude: string;
  longitude: string;
};

export type UpdateEstablishmentInput = Partial<Omit<CreateEstablishmentInput, "code">>;

type EstablishmentRow = {
  establecimiento_id: string;
  nombre_establecimiento: string;
  tipo_establecimiento: string | null;
  nivel_atencion: number | null;
  red_salud: string | null;
  municipio_id: string | null;
  latitud: number | null;
  longitud: number | null;
  municipio?: { nombre_municipio: string } | null;
};

const fallbackEstablishments: EstablishmentListItem[] = [
  { id: "EST-LPZ-001", code: "EST-LPZ-001", name: "Hospital La Paz", municipality: "La Paz", type: "Hospital", level: "3" },
  { id: "EST-SCZ-001", code: "EST-SCZ-001", name: "Hospital Santa Cruz", municipality: "Santa Cruz", type: "Hospital", level: "3" },
  { id: "EST-CBB-001", code: "EST-CBB-001", name: "Hospital Cochabamba", municipality: "Cochabamba", type: "Hospital", level: "3" },
];

function rowToListItem(row: EstablishmentRow): EstablishmentListItem {
  return {
    id: row.establecimiento_id,
    code: row.establecimiento_id,
    name: row.nombre_establecimiento,
    municipality: row.municipio?.nombre_municipio ?? row.municipio_id ?? "N/A",
    type: row.tipo_establecimiento ?? "N/A",
    level: row.nivel_atencion != null ? String(row.nivel_atencion) : "N/A",
  };
}

export async function getEstablishmentsSnapshot(query: string = ""): Promise<EstablishmentsSnapshot> {
  try {
    // Session client — RLS filters establishments by territory
    const client = await createServerSupabaseClient();
    const search = query.trim();

    const { data, error } = search
      ? await client
          .from("establecimiento")
          .select("establecimiento_id, nombre_establecimiento, tipo_establecimiento, nivel_atencion, municipio_id, municipio(nombre_municipio)")
          .or(`nombre_establecimiento.ilike.%${search}%,establecimiento_id.ilike.%${search}%`)
          .limit(50)
      : await client
          .from("establecimiento")
          .select("establecimiento_id, nombre_establecimiento, tipo_establecimiento, nivel_atencion, municipio_id, municipio(nombre_municipio)")
          .limit(50);

    if (error) throw error;

    const items = (data ?? []).map((row) => rowToListItem(row as any));
    return { live: true, total: items.length, items, source: "supabase" };
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return { live: false, total: fallbackEstablishments.length, items: fallbackEstablishments, source: "fallback" };
  }
}

export async function getEstablishmentDetail(id: string): Promise<EstablishmentDetail | null> {
  try {
    const client = await createServerSupabaseClient();

    const { data, error } = await client
      .from("establecimiento")
      .select("establecimiento_id, nombre_establecimiento, tipo_establecimiento, nivel_atencion, red_salud, municipio_id, latitud, longitud")
      .eq("establecimiento_id", id)
      .single();

    if (error || !data) return null;

    const row = data as EstablishmentRow;
    return {
      id: row.establecimiento_id,
      code: row.establecimiento_id,
      name: row.nombre_establecimiento,
      type: row.tipo_establecimiento ?? "",
      level: row.nivel_atencion != null ? String(row.nivel_atencion) : "",
      networkHealth: row.red_salud ?? "",
      municipalityId: row.municipio_id ?? "",
      latitude: row.latitud != null ? String(row.latitud) : "",
      longitude: row.longitud != null ? String(row.longitud) : "",
    };
  } catch (error) {
    console.error("Error fetching establishment detail:", error);
    return null;
  }
}

export async function createEstablishment(input: CreateEstablishmentInput): Promise<{ ok: boolean; message: string; id?: string }> {
  try {
    const client = await createServerSupabaseClient();

    const { data, error } = await client
      .from("establecimiento")
      .insert({
        establecimiento_id: input.code,
        nombre_establecimiento: input.name,
        tipo_establecimiento: input.type || null,
        nivel_atencion: input.level ? (parseInt(input.level) || null) : null,
        red_salud: input.networkHealth || null,
        municipio_id: input.municipalityId || null,
        latitud: input.latitude ? parseFloat(input.latitude) : null,
        longitud: input.longitude ? parseFloat(input.longitude) : null,
      })
      .select("establecimiento_id")
      .single();

    if (error) throw error;

    return { ok: true, message: "Establecimiento creado exitosamente", id: (data as any)?.establecimiento_id };
  } catch (error) {
    console.error("Error creating establishment:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error creando establecimiento" };
  }
}

export async function updateEstablishment(id: string, input: UpdateEstablishmentInput): Promise<{ ok: boolean; message: string }> {
  try {
    const client = await createServerSupabaseClient();

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.nombre_establecimiento = input.name;
    if (input.type !== undefined) updateData.tipo_establecimiento = input.type || null;
    if (input.level !== undefined) updateData.nivel_atencion = input.level ? (parseInt(input.level) || null) : null;
    if (input.networkHealth !== undefined) updateData.red_salud = input.networkHealth || null;
    if (input.municipalityId !== undefined) updateData.municipio_id = input.municipalityId || null;
    if (input.latitude !== undefined) updateData.latitud = input.latitude ? parseFloat(input.latitude) : null;
    if (input.longitude !== undefined) updateData.longitud = input.longitude ? parseFloat(input.longitude) : null;

    if (Object.keys(updateData).length === 0) return { ok: true, message: "Sin cambios" };

    const { error } = await client.from("establecimiento").update(updateData).eq("establecimiento_id", id);

    if (error) throw error;

    return { ok: true, message: "Establecimiento actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating establishment:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error actualizando establecimiento" };
  }
}
