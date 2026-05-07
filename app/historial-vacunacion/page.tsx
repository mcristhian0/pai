import { getVaccinationSnapshot } from "@/lib/vaccination-data";
import { getPatientDetail } from "@/lib/patients-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HistorialPageProps = {
  searchParams?: Promise<{
    ci?: string;
  }>;
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

export default async function HistorialVacunacionPage({ searchParams }: HistorialPageProps) {
  const params = await searchParams;
  const ci = params?.ci ?? "";

  let patientName = "";
  let historialItems: Array<{
    id: string;
    patient: string;
    vaccine: string;
    dose: string;
    facility: string;
    date: string;
    route: string;
    status: string;
  }> = [];

  if (ci.trim()) {
    // Buscar paciente por CI
    try {
      const supabase = await createServerSupabaseClient();

      const { data: patientRow, error } = await supabase
        .from("paciente")
        .select("paciente_id, nombres, primer_apellido, segundo_apellido")
        .eq("documento_identidad", ci.trim())
        .maybeSingle();

      if (error) throw error;

      if (!patientRow) {
        patientName = "No encontrado";
      } else {
        patientName = [patientRow.nombres, patientRow.primer_apellido, patientRow.segundo_apellido]
          .filter(Boolean)
          .join(" ") || "Paciente sin nombre";

        // Obtener historial del paciente
        const { data: historialData } = await supabase
          .from("registro_vacunacion")
          .select(
            "registro_id, paciente_id, numero_dosis, fecha_vacunacion, via_administracion, vacuna(vacuna_nombre), establecimiento(nombre_establecimiento)",
          )
          .eq("paciente_id", patientRow.paciente_id)
          .order("fecha_vacunacion", { ascending: false });

        historialItems = (historialData ?? []).map((r: any) => ({
          id: r.registro_id,
          patient: patientName,
          vaccine: r.vacuna?.vacuna_nombre ?? "N/A",
          dose: formatDoseLabel(r.numero_dosis),
          facility: r.establecimiento?.nombre_establecimiento ?? "N/A",
          date: (r.fecha_vacunacion ?? "").slice(0, 10) || "-",
          route: r.via_administracion ?? "-",
          status: "Completo",
        }));
      }
    } catch (error) {
      console.error("Error fetching patient historial:", error);
      patientName = "Error al cargar";
    }
  } else {
    // Si no hay CI, cargar eventos recientes del scope
    const snapshot = await getVaccinationSnapshot("");
    historialItems = snapshot.items;
  }

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Modulo operativo</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Historial Vacunación</h1>
              <p className="mt-2 text-sm text-muted">
                Consulta el historial de eventos de vacunación registrados.
              </p>
            </div>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" method="get">
            <input
              name="ci"
              defaultValue={ci}
              placeholder="Buscar por CI del paciente"
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none ring-accent focus:ring"
            />
            <button
              type="submit"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)]"
            >
              Buscar
            </button>
          </form>
        </header>

        <section className="glass-panel rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {ci.trim() ? `Historial de ${patientName}` : "Eventos recientes"}
            </h2>
            <span className="mono rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted">
              Total: {historialItems.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border bg-white/80">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Vacuna</th>
                  <th className="px-4 py-3">Dosis</th>
                  <th className="px-4 py-3">Establecimiento</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Via</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historialItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      {ci.trim() ? "No hay eventos para este paciente." : "No hay eventos registrados."}
                    </td>
                  </tr>
                ) : (
                  historialItems.map((event) => (
                    <tr key={event.id} className="hover:bg-white">
                      <td className="px-4 py-3 font-medium text-foreground">{event.patient}</td>
                      <td className="px-4 py-3 text-muted">{event.vaccine}</td>
                      <td className="px-4 py-3 text-muted">{event.dose}</td>
                      <td className="px-4 py-3 text-muted">{event.facility}</td>
                      <td className="px-4 py-3 mono text-muted">{event.date}</td>
                      <td className="px-4 py-3 text-muted">{event.route}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            event.status === "Completo"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
