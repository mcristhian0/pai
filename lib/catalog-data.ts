import "server-only";

import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";

export type CatalogSnapshot = {
  live: boolean;
  vaccines: Array<{ code: string; name: string }>;
  establishments: Array<{ code: string; name: string }>;
};

export type VaccineRow = {
  vacuna_id: string;
  vacuna_nombre: string;
  numero_dosis: number;
};

export type CreateVaccineInput = {
  cod_vacuna: string;
  nombre: string;
  numero_dosis?: number;
};

export type UpdateVaccineInput = {
  nombre?: string;
};

export type VaccineSnapshot = {
  total: number;
  items: Array<{ id: string; code: string; name: string; numeroDosis: number }>;
  live: boolean;
  source: "supabase" | "fallback";
};

export type DoseSnapshot = {
  total: number;
  items: Array<{ id: number; vaccineId: number; doseNumber: number }>;
  live: boolean;
  source: "supabase" | "fallback";
};

export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  const supabase = await createServerSupabaseClient();

  const [vaccinesResult, establishmentsResult] = await Promise.all([
    supabase.from("vacuna").select("vacuna_id, vacuna_nombre").order("vacuna_nombre", { ascending: true }).limit(50),
    supabase.from("establecimiento").select("establecimiento_id, nombre_establecimiento").eq("activo", true).order("nombre_establecimiento", { ascending: true }).limit(50),
  ]);

  if (vaccinesResult.error || establishmentsResult.error) {
    return {
      live: false,
      vaccines: [{ code: "VAC-BCG", name: "BCG" }],
      establishments: [{ code: "EST-LPZ-001", name: "Hospital La Paz" }],
    };
  }

  return {
    live: true,
    vaccines: (vaccinesResult.data ?? []).map((row: any) => ({
      code: row.vacuna_id,
      name: row.vacuna_nombre,
    })),
    establishments: (establishmentsResult.data ?? []).map((row: any) => ({
      code: row.establecimiento_id,
      name: row.nombre_establecimiento,
    })),
  };
}

export async function getVaccinesSnapshot(query?: string): Promise<VaccineSnapshot> {
  const admin = createServerSupabaseAdminClient();

  let qb = admin
    .from("vacuna")
    .select("vacuna_id, vacuna_nombre, numero_dosis")
    .order("vacuna_nombre", { ascending: true });

  if (query) {
    qb = qb.or(`vacuna_id.ilike.%${query}%,vacuna_nombre.ilike.%${query}%`);
  }

  const { data, error } = await qb;

  if (error) {
    console.error("Error fetching vaccines:", error);
    return { total: 0, items: [], live: false, source: "fallback" };
  }

  const items = (data ?? []).map((row: any) => ({
    id: row.vacuna_id as string,
    code: row.vacuna_id as string,
    name: row.vacuna_nombre as string,
    numeroDosis: row.numero_dosis as number,
  }));

  return { total: items.length, items, live: true, source: "supabase" };
}

export async function createVaccine(input: CreateVaccineInput) {
  const supabase = await createServerSupabaseClient();

  if (!input.cod_vacuna || !input.nombre) {
    throw new Error("Código y nombre requeridos");
  }

  const { data, error } = await supabase
    .from("vacuna")
    .insert([{
      vacuna_id: input.cod_vacuna,
      vacuna_nombre: input.nombre,
      numero_dosis: input.numero_dosis ?? 1,
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear vacuna: ${error.message}`);

  return data as VaccineRow;
}

export async function updateVaccine(vaccineId: string, input: UpdateVaccineInput) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("vacuna")
    .update({ ...(input.nombre && { vacuna_nombre: input.nombre }) })
    .eq("vacuna_id", vaccineId)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar vacuna: ${error.message}`);

  return data as VaccineRow;
}

export async function getDosesSnapshot(): Promise<DoseSnapshot> {
  return { total: 0, items: [], live: false, source: "fallback" };
}
