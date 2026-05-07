import "server-only";

import {
  alerts,
  coverage,
  facilities,
  metrics,
  recentEvents,
  timeline,
  vaccineCatalog,
  type CoverageRow,
  type EventRow,
  type FacilityRow,
  type MetricCard,
  type TimelineItem,
  type VaccineRow,
} from "@/lib/dashboard-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardSnapshot = {
  live: boolean;
  metrics: MetricCard[];
  coverage: CoverageRow[];
  timeline: TimelineItem[];
  recentEvents: EventRow[];
  vaccineCatalog: VaccineRow[];
  facilities: FacilityRow[];
  alerts: string[];
};

function formatDoseLabel(value: number | null) {
  if (!value) return "-";
  if (value === 1) return "1ra";
  if (value === 2) return "2da";
  if (value === 3) return "3ra";
  if (value === 4) return "4ta";
  if (value === 5) return "5ta";
  return `${value}ta`;
}

function buildMetricCards(values: {
  totalEvents: number;
  patients: number;
  vaccines: number;
  facilities: number;
}) {
  return [
    {
      label: "Eventos capturados",
      value: values.totalEvents.toLocaleString("es-BO"),
      delta: "Registros confirmados desde Supabase",
      tone: "emerald",
    },
    {
      label: "Pacientes registrados",
      value: values.patients.toLocaleString("es-BO"),
      delta: "Base maestra de pacientes activa",
      tone: "cyan",
    },
    {
      label: "Vacunas catalogadas",
      value: values.vaccines.toLocaleString("es-BO"),
      delta: "Catálogo sincronizado con la base",
      tone: "amber",
    },
    {
      label: "Establecimientos",
      value: values.facilities.toLocaleString("es-BO"),
      delta: "En alcance del sistema",
      tone: "rose",
    },
  ] satisfies MetricCard[];
}

async function safeCount(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  const result = await query;
  if (result.error) return null;
  return result.count;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = await createServerSupabaseClient();

  const [eventsCount, patientsCount, vaccinesCount, facilitiesCount, recentEventsResult] = await Promise.all([
    safeCount(supabase.from("registro_vacunacion").select("registro_id", { count: "exact", head: true })),
    safeCount(supabase.from("paciente").select("paciente_id", { count: "exact", head: true })),
    safeCount(supabase.from("vacuna").select("vacuna_id", { count: "exact", head: true })),
    safeCount(supabase.from("establecimiento").select("establecimiento_id", { count: "exact", head: true })),
    supabase
      .from("registro_vacunacion")
      .select("registro_id, paciente_id, vacuna_id, numero_dosis, establecimiento_id, fecha_vacunacion, creado_en, paciente(nombres, primer_apellido, segundo_apellido), vacuna(vacuna_nombre), establecimiento(nombre_establecimiento)")
      .order("creado_en", { ascending: false })
      .limit(5),
  ]);

  const hasLiveData =
    [eventsCount, patientsCount, vaccinesCount, facilitiesCount].every((r) => typeof r === "number") &&
    !recentEventsResult.error;

  if (!hasLiveData) {
    return { live: false, metrics, coverage, timeline, recentEvents, vaccineCatalog, facilities, alerts };
  }

  const liveRecentEvents = (recentEventsResult.data ?? []).map((row: any) => {
    const patient = row.paciente;
    const patientName = patient
      ? [patient.nombres, patient.primer_apellido, patient.segundo_apellido].filter(Boolean).join(" ")
      : "Paciente sin nombre";

    return {
      patient: patientName || "Paciente sin nombre",
      vaccine: row.vacuna?.vacuna_nombre ?? "Vacuna sin resolver",
      facility: row.establecimiento?.nombre_establecimiento ?? "Establecimiento sin resolver",
      date: (row.fecha_vacunacion ?? row.creado_en ?? "").slice(0, 10) || "-",
      dose: formatDoseLabel(row.numero_dosis),
      status: "Completo",
    } satisfies EventRow;
  });

  return {
    live: true,
    metrics: buildMetricCards({
      totalEvents: eventsCount ?? 0,
      patients: patientsCount ?? 0,
      vaccines: vaccinesCount ?? 0,
      facilities: facilitiesCount ?? 0,
    }),
    coverage,
    timeline,
    recentEvents: liveRecentEvents,
    vaccineCatalog,
    facilities,
    alerts: [
      `${eventsCount ?? 0} eventos de vacunación registrados`,
      `${patientsCount ?? 0} pacientes en el sistema`,
      `Catálogos sincronizados con Supabase`,
      `Sistema PAI operativo`,
    ],
  };
}
