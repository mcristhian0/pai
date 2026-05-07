import Link from "next/link";
import { getPatientDetail } from "@/lib/patients-data";
import PatientForm from "@/app/pacientes/patient-form";

export const dynamic = "force-dynamic";

type PatientDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isEditing = sp?.edit === "true";

  const result = await getPatientDetail(id);

  if (!result) {
    return (
      <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
          <div className="glass-panel rounded-[28px] p-5 text-center">
            <p className="text-muted">Paciente no encontrado</p>
            <Link href="/pacientes" className="mt-4 inline-block text-accent hover:underline">
              Volver a pacientes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { patient, historial, raw } = result;

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        {isEditing ? (
          <section className="glass-panel rounded-[28px] p-5 sm:p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-foreground">Editar Paciente</h1>
              <p className="mt-1 text-sm text-muted">Actualiza los datos del paciente</p>
            </div>
            <PatientForm
              initialData={{
                id,
                ci: patient.ci.split(" ")[0],
                ciComp: patient.ci.split(" ").slice(1).join(" ") || "",
                names: raw.nombres,
                apPaterno: raw.apPaterno,
                apMaterno: raw.apMaterno,
                sex: raw.sex,
                birthDate: raw.birthDate,
                isIndigenous: raw.isIndigenous,
              }}
            />
          </section>
        ) : (
          <>
            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Detalle del paciente</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{patient.fullName}</h1>
                  <p className="mt-2 text-sm text-muted">CI: {patient.ci}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/pacientes/${id}?edit=true`}
                    className="rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)]"
                  >
                    Editar
                  </Link>
                  <Link
                    href="/pacientes"
                    className="rounded-2xl border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground hover:bg-white/80"
                  >
                    Volver
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Sexo</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{patient.sex === "M" ? "Masculino" : "Femenino"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Nacimiento</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{patient.birthDate}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Indígena</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{patient.indigenous}</p>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-[28px] p-5">
              <h2 className="text-lg font-semibold text-foreground">Historial de Vacunación</h2>

              <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white/80">
                <table className="min-w-full divide-y divide-border text-left text-sm">
                  <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Vacuna</th>
                      <th className="px-4 py-3">Dosis</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Establecimiento</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historial.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted">
                          Sin eventos de vacunación registrados
                        </td>
                      </tr>
                    ) : (
                      historial.map((event) => (
                        <tr key={event.id} className="hover:bg-white">
                          <td className="px-4 py-3 font-medium text-foreground">{event.vaccine}</td>
                          <td className="px-4 py-3 text-muted">{event.dose}</td>
                          <td className="px-4 py-3 mono text-muted">{event.date}</td>
                          <td className="px-4 py-3 text-muted">{event.establishment}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
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
          </>
        )}
      </div>
    </main>
  );
}
