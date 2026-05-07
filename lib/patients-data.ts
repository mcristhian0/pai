import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PatientListItem = {
  id: string;
  ci: string;
  fullName: string;
  sex: string;
  birthDate: string;
  indigenous: string;
  updatedAt: string;
};

export type PatientsSnapshot = {
  live: boolean;
  total: number;
  items: PatientListItem[];
  source: "supabase" | "fallback";
};

type PatientRow = {
  paciente_id: string;
  documento_identidad: string | null;
  nombres: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  es_pueblo_indigena: boolean | null;
  municipio_residencia: string | null;
  actualizado_en: string | null;
};

const fallbackPatients: PatientListItem[] = [
  {
    id: "fallback-1",
    ci: "17485207",
    fullName: "Camila Villca Paredes",
    sex: "F",
    birthDate: "2020-06-14",
    indigenous: "No",
    updatedAt: "2026-05-01",
  },
  {
    id: "fallback-2",
    ci: "53149813",
    fullName: "Gonzalo Fernandez Yujra",
    sex: "M",
    birthDate: "1985-09-23",
    indigenous: "Si",
    updatedAt: "2026-05-01",
  },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function composeName(row: PatientRow) {
  return [row.nombres, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(" ") || "Paciente sin nombre";
}

function rowToListItem(row: PatientRow): PatientListItem {
  return {
    id: row.paciente_id,
    ci: row.documento_identidad ?? "Sin CI",
    fullName: composeName(row),
    sex: row.genero ?? "-",
    birthDate: formatDate(row.fecha_nacimiento),
    indigenous: row.es_pueblo_indigena ? "Si" : "No",
    updatedAt: formatDate(row.actualizado_en),
  };
}

const PATIENT_COLS = "paciente_id, documento_identidad, nombres, primer_apellido, segundo_apellido, genero, fecha_nacimiento, es_pueblo_indigena, municipio_residencia, actualizado_en";

export async function getPatientsSnapshot(search: string): Promise<PatientsSnapshot> {
  // Session client — RLS filters patients by territory (paciente_admin_dep_ver_departamento, etc.)
  const supabase = await createServerSupabaseClient();
  const query = search.trim();

  try {
    const countPromise = supabase.from("paciente").select("paciente_id", { count: "exact", head: true });

    const patientsPromise = query
      ? supabase
          .from("paciente")
          .select(PATIENT_COLS)
          .or(`nombres.ilike.%${query}%,primer_apellido.ilike.%${query}%,segundo_apellido.ilike.%${query}%,documento_identidad.ilike.%${query}%`)
          .order("actualizado_en", { ascending: false })
          .limit(50)
      : supabase
          .from("paciente")
          .select(PATIENT_COLS)
          .order("actualizado_en", { ascending: false })
          .limit(50);

    const [countResult, patientsResult] = await Promise.all([countPromise, patientsPromise]);

    if (countResult.error || patientsResult.error) {
      return { live: false, total: fallbackPatients.length, items: fallbackPatients, source: "fallback" };
    }

    const items = (patientsResult.data ?? []).map((row) => rowToListItem(row as PatientRow));
    return { live: true, total: countResult.count ?? items.length, items, source: "supabase" };
  } catch (error) {
    console.error("getPatientsSnapshot error:", error);
    return { live: false, total: fallbackPatients.length, items: fallbackPatients, source: "fallback" };
  }
}

export type CreatePatientInput = {
  ci: string;
  ciComp: string;
  names: string;
  apPaterno: string;
  apMaterno: string;
  sex: string;
  birthDate: string;
  isIndigenous: boolean;
  municipioId?: string;
};

export type UpdatePatientInput = Partial<CreatePatientInput>;

export type PatientHistorialItem = {
  id: string;
  vaccine: string;
  dose: string;
  date: string;
  establishment: string;
  status: string;
};

export type PatientRaw = {
  nombres: string;
  apPaterno: string;
  apMaterno: string;
  sex: string;
  birthDate: string;
  isIndigenous: boolean;
};

export async function getPatientDetail(
  id: string,
): Promise<{ patient: PatientListItem; historial: PatientHistorialItem[]; raw: PatientRaw } | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: patientData, error: patientError } = await supabase
      .from("paciente")
      .select(PATIENT_COLS)
      .eq("paciente_id", id)
      .single();

    if (patientError || !patientData) return null;

    const row = patientData as PatientRow;
    const patient = rowToListItem(row);
    const raw: PatientRaw = {
      nombres: row.nombres ?? "",
      apPaterno: row.primer_apellido ?? "",
      apMaterno: row.segundo_apellido ?? "",
      sex: row.genero ?? "M",
      birthDate: formatDate(row.fecha_nacimiento),
      isIndigenous: row.es_pueblo_indigena ?? false,
    };

    const { data: historialData } = await supabase
      .from("registro_vacunacion")
      .select("registro_id, vacuna(vacuna_nombre), numero_dosis, fecha_vacunacion, establecimiento(nombre_establecimiento)")
      .eq("paciente_id", id)
      .order("fecha_vacunacion", { ascending: false });

    const historial: PatientHistorialItem[] = (historialData ?? []).map((r: any) => ({
      id: r.registro_id,
      vaccine: r.vacuna?.vacuna_nombre ?? "N/A",
      dose: r.numero_dosis ? `Dosis ${r.numero_dosis}` : "N/A",
      date: formatDate(r.fecha_vacunacion),
      establishment: r.establecimiento?.nombre_establecimiento ?? "N/A",
      status: "Registrado",
    }));

    return { patient, historial, raw };
  } catch (error) {
    console.error("Error fetching patient detail:", error);
    return null;
  }
}

export async function createPatient(input: CreatePatientInput): Promise<{ ok: boolean; message: string; id?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: existing } = await supabase
      .from("paciente")
      .select("paciente_id")
      .eq("documento_identidad", input.ci)
      .limit(1);

    if (existing && existing.length > 0) {
      return { ok: false, message: "CI ya existe en el sistema" };
    }

    const { data, error } = await supabase
      .from("paciente")
      .insert({
        documento_identidad: input.ci,
        nombres: input.names,
        primer_apellido: input.apPaterno,
        segundo_apellido: input.apMaterno || null,
        genero: input.sex,
        fecha_nacimiento: input.birthDate,
        es_pueblo_indigena: input.isIndigenous,
        municipio_residencia: input.municipioId || null,
      })
      .select("paciente_id")
      .single();

    if (error) throw error;

    return { ok: true, message: "Paciente creado exitosamente", id: (data as any)?.paciente_id };
  } catch (error: any) {
    console.error("Error creating patient:", error);
    if (error?.code === "42501") {
      return { ok: false, message: "Sin permisos para registrar pacientes en ese municipio. Verifique que el municipio corresponde a su alcance." };
    }
    if (error?.code === "23505") {
      return { ok: false, message: "Ya existe un paciente con ese CI." };
    }
    return { ok: false, message: error instanceof Error ? error.message : "Error creando paciente" };
  }
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const updateData: Record<string, any> = {};
    if (input.names !== undefined) updateData.nombres = input.names;
    if (input.apPaterno !== undefined) updateData.primer_apellido = input.apPaterno;
    if (input.apMaterno !== undefined) updateData.segundo_apellido = input.apMaterno || null;
    if (input.sex !== undefined) updateData.genero = input.sex;
    if (input.birthDate !== undefined) updateData.fecha_nacimiento = input.birthDate;
    if (input.isIndigenous !== undefined) updateData.es_pueblo_indigena = input.isIndigenous;

    if (Object.keys(updateData).length === 0) {
      return { ok: true, message: "Sin cambios" };
    }

    const { error } = await supabase.from("paciente").update(updateData).eq("paciente_id", id);

    if (error) throw error;

    return { ok: true, message: "Paciente actualizado exitosamente" };
  } catch (error) {
    console.error("Error updating patient:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error actualizando paciente" };
  }
}
