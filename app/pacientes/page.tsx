import Link from "next/link";
import { getPatientsSnapshot } from "@/lib/patients-data";

export const dynamic = "force-dynamic";

type PacientesPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const patients = await getPatientsSnapshot(query);

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        <header className="page-section">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="page-eyebrow">Modulo operativo</p>
              <h1 className="page-title">Pacientes</h1>
              <p className="page-copy">
                Registro maestro de pacientes con busqueda rapida para vacunacion y auditoria.
              </p>
              <Link
                href="/pacientes/new"
                className="action-primary mt-3 inline-block px-4 py-2"
              >
                Nuevo paciente
              </Link>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                patients.live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              Fuente: {patients.source}
            </span>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre o CI"
              className="input-base"
            />
            <button type="submit" className="action-primary px-5 py-3">
              Buscar
            </button>
          </form>
        </header>

        <section className="page-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Listado de pacientes</h2>
            <span className="mono rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted">
              Total: {patients.total.toLocaleString("es-BO")}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white/80">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">CI</th>
                  <th className="px-4 py-3">Nombre completo</th>
                  <th className="px-4 py-3">Sexo</th>
                  <th className="px-4 py-3">Nacimiento</th>
                  <th className="px-4 py-3">Indigena</th>
                  <th className="px-4 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No se encontraron pacientes para la busqueda actual.
                    </td>
                  </tr>
                ) : (
                  patients.items.map((patient) => (
                    <tr key={patient.id} className="hover:bg-white">
                      <td className="px-4 py-3 mono text-muted">{patient.ci}</td>
                      <td className="px-4 py-3 font-medium text-accent hover:underline">
                        <Link href={`/pacientes/${patient.id}`}>{patient.fullName}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{patient.sex}</td>
                      <td className="px-4 py-3 mono text-muted">{patient.birthDate}</td>
                      <td className="px-4 py-3 text-muted">{patient.indigenous}</td>
                      <td className="px-4 py-3 mono text-muted">{patient.updatedAt}</td>
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