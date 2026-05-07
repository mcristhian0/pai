import "server-only";

import { createServerSupabaseClient, createServerSupabaseAdminClient } from "@/lib/supabase/server";

export type VaccinationEventListItem = {
  id: string;
  patient: string;
  vaccine: string;
  dose: string;
  facility: string;
  date: string;
  route: string;
  status: string;
};

export type VaccinationSnapshot = {
  live: boolean;
  total: number;
  items: VaccinationEventListItem[];
  source: "supabase" | "fallback";
};

export type VaccinationOption = {
  value: string;
  label: string;
};

export type VaccinationOptions = {
  patients: VaccinationOption[];
  vaccines: VaccinationOption[];
  doses: Array<VaccinationOption & { vaccineId: string }>;
  establishments: VaccinationOption[];
};

export type CreateVaccinationEventInput = {
  patientId: string;
  vaccineId: string;
  doseId: string;
  establishmentId: string;
  loteText: string;
  vaccinationDate: string;
  route: string;
  ageDays: string;
  temperature: string;
  observations: string;
};

export type CreateVaccinationEventResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

const fallbackEvents: VaccinationEventListItem[] = [
  {
    id: "fallback-ev-1",
    patient: "Camila Villca Paredes",
    vaccine: "Pentavalente",
    dose: "2da",
    facility: "Hospital La Paz",
    date: "2025-05-21",
    route: "Intramuscular",
    status: "Completo",
  },
];

function formatPatientName(row: { nombres: string | null; primer_apellido: string | null; segundo_apellido: string | null }) {
  return [row.nombres, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(" ") || "Paciente sin nombre";
}

function formatDoseLabel(value: number | null) {
  if (!value) return "-";
  if (value === 1) return "1ra";
  if (value === 2) return "2da";
  if (value === 3) return "3ra";
  if (value === 4) return "4ta";
  if (value === 5) return "5ta";
  return `${value}ta`;
}

function toDateOnly(value: string | null) {
  return (value ?? "").slice(0, 10) || "-";
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getVaccinationOptions(): Promise<VaccinationOptions> {
  const admin = createServerSupabaseAdminClient();
  const supabase = await createServerSupabaseClient();

  // vacuna no tiene RLS — admin client garantiza que siempre retorna datos
  const vaccinesResult = await admin
    .from("vacuna")
    .select("vacuna_id, vacuna_nombre, numero_dosis")
    .order("vacuna_nombre", { ascending: true })
    .limit(200);

  // establecimiento y paciente usan session client (RLS filtra por scope del usuario)
  const [establishmentsResult, patientsResult] = await Promise.all([
    supabase
      .from("establecimiento")
      .select("establecimiento_id, nombre_establecimiento")
      .eq("activo", true)
      .order("nombre_establecimiento", { ascending: true })
      .limit(200),
    supabase
      .from("paciente")
      .select("paciente_id, documento_identidad, nombres, primer_apellido, segundo_apellido")
      .limit(150),
  ]);

  if (vaccinesResult.error) {
    console.error("Error fetching vaccines:", vaccinesResult.error);
  }

  const vaccineRows = vaccinesResult.data ?? [];

  const vaccines = vaccineRows.map((row: any) => ({
    value: row.vacuna_id,
    label: `${row.vacuna_nombre} (${row.vacuna_id})`,
  }));

  const doses = vaccineRows.flatMap((row: any) =>
    Array.from({ length: row.numero_dosis as number }, (_, i) => ({
      value: String(i + 1),
      vaccineId: row.vacuna_id as string,
      label: `Dosis ${i + 1}`,
    })),
  );

  const establishments = (establishmentsResult.data ?? []).map((row: any) => ({
    value: row.establecimiento_id,
    label: row.nombre_establecimiento,
  }));

  const patients = (patientsResult.data ?? []).map((row: any) => ({
    value: row.paciente_id,
    label: `${formatPatientName(row)} (${row.documento_identidad ?? "Sin CI"})`,
  }));

  return { patients, vaccines, doses, establishments };
}

export async function getVaccinationSnapshot(search: string): Promise<VaccinationSnapshot> {
  const supabase = await createServerSupabaseClient();
  const query = search.trim().toLowerCase();

  const { data, error, count } = await supabase
    .from("registro_vacunacion")
    .select(
      "registro_id, paciente_id, vacuna_id, numero_dosis, establecimiento_id, fecha_vacunacion, via_administracion, creado_en, paciente(nombres, primer_apellido, segundo_apellido), vacuna(vacuna_nombre), establecimiento(nombre_establecimiento)",
      { count: "exact" },
    )
    .order("creado_en", { ascending: false })
    .limit(80);

  if (error || !data) {
    return { live: false, total: fallbackEvents.length, items: fallbackEvents, source: "fallback" };
  }

  const allItems = (data as any[]).map((row) => ({
    id: row.registro_id,
    patient: row.paciente ? formatPatientName(row.paciente) : "Paciente no resuelto",
    vaccine: row.vacuna?.vacuna_nombre ?? "Vacuna no resuelta",
    dose: formatDoseLabel(row.numero_dosis),
    facility: row.establecimiento?.nombre_establecimiento ?? "Establecimiento no resuelto",
    date: toDateOnly(row.fecha_vacunacion ?? row.creado_en),
    route: row.via_administracion ?? "-",
    status: "Completo",
  })) satisfies VaccinationEventListItem[];

  const items = query
    ? allItems.filter((item) => {
        const haystack = `${item.patient} ${item.vaccine} ${item.facility} ${item.route}`.toLowerCase();
        return haystack.includes(query);
      })
    : allItems;

  return { live: true, total: count ?? items.length, items: items.slice(0, 50), source: "supabase" };
}

export async function createVaccinationEvent(
  input: CreateVaccinationEventInput,
): Promise<CreateVaccinationEventResult> {
  const admin = createServerSupabaseAdminClient();
  const supabase = await createServerSupabaseClient();

  const patientId = input.patientId.trim();
  const vaccineId = input.vaccineId.trim();
  const doseNumber = toNumber(input.doseId);
  const establishmentId = input.establishmentId.trim();
  const ageDays = toNumber(input.ageDays);
  const temperature = toNumber(input.temperature);
  const vaccinationDate = parseDate(input.vaccinationDate);

  if (!patientId || !vaccineId || !doseNumber || !establishmentId || !vaccinationDate) {
    return { ok: false, message: "Completa los campos obligatorios del evento de vacunación." };
  }

  const [vaccineResult, previousResult] = await Promise.all([
    admin
      .from("vacuna")
      .select("vacuna_id, numero_dosis, edad_minima_dias, edad_maxima_dias, intervalo_minimo_dias")
      .eq("vacuna_id", vaccineId)
      .maybeSingle(),
    supabase
      .from("registro_vacunacion")
      .select("fecha_vacunacion")
      .eq("paciente_id", patientId)
      .eq("vacuna_id", vaccineId)
      .order("fecha_vacunacion", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (vaccineResult.error) {
    return { ok: false, message: "No fue posible validar reglas de vacunación." };
  }

  const vaccine = vaccineResult.data as {
    vacuna_id: string;
    numero_dosis: number;
    edad_minima_dias: number | null;
    edad_maxima_dias: number | null;
    intervalo_minimo_dias: number | null;
  } | null;

  if (!vaccine) {
    return { ok: false, message: "Vacuna no encontrada." };
  }

  if (doseNumber > vaccine.numero_dosis) {
    return {
      ok: false,
      message: `Esta vacuna solo requiere ${vaccine.numero_dosis} dosis. Dosis ${doseNumber} no es válida.`,
    };
  }

  if (ageDays !== null) {
    if (vaccine.edad_minima_dias !== null && ageDays < vaccine.edad_minima_dias) {
      return { ok: false, message: `Edad mínima para esta vacuna: ${vaccine.edad_minima_dias} días.` };
    }
    if (vaccine.edad_maxima_dias !== null && ageDays > vaccine.edad_maxima_dias) {
      return { ok: false, message: `Edad máxima para esta vacuna: ${vaccine.edad_maxima_dias} días.` };
    }
  }

  if (vaccine.intervalo_minimo_dias && previousResult.data) {
    const prevDate = parseDate((previousResult.data as any).fecha_vacunacion);
    if (prevDate) {
      const diffDays = Math.floor((vaccinationDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < vaccine.intervalo_minimo_dias) {
        return {
          ok: false,
          message: `Intervalo mínimo entre dosis: ${vaccine.intervalo_minimo_dias} días (han pasado ${diffDays} días).`,
        };
      }
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("registro_vacunacion")
    .insert({
      paciente_id: patientId,
      vacuna_id: vaccineId,
      numero_dosis: doseNumber,
      establecimiento_id: establishmentId,
      lote_vacuna: input.loteText.trim() || null,
      fecha_vacunacion: vaccinationDate.toISOString(),
      via_administracion: input.route.trim() || null,
      temperatura_conservacion: temperature,
      edad_dias_aplicacion: ageDays,
      observaciones: input.observations.trim() || null,
    })
    .select("registro_id")
    .single();

  if (insertError || !inserted?.registro_id) {
    return {
      ok: false,
      message: "No se pudo registrar el evento. Verifica permisos (RLS) y alcance de establecimiento.",
    };
  }

  return { ok: true, id: inserted.registro_id };
}
