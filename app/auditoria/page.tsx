import { getAuditSnapshot } from "@/lib/audit-data";

export const dynamic = "force-dynamic";

type AuditoriaPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";

  const snapshot = await getAuditSnapshot(query);

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Modulo de trazabilidad</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Auditoria</h1>
              <p className="mt-2 text-sm text-muted">
                Historial de operaciones sobre tablas criticas del sistema de vacunacion.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                snapshot.tableAvailable ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {snapshot.tableAvailable ? "Tabla auditoria activa" : "Tabla auditoria no encontrada"}
            </span>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por usuario, accion, tabla o registro"
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
          {!snapshot.tableAvailable ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El SQL actual no expone la tabla auditoria en la base conectada. Por eso ves datos de fallback para no bloquear el flujo.
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-3xl border border-border bg-white/80">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Accion</th>
                  <th className="px-4 py-3">Tabla</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshot.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No hay trazas para la busqueda actual.
                    </td>
                  </tr>
                ) : (
                  snapshot.items.map((item) => (
                    <tr key={item.id} className="hover:bg-white">
                      <td className="px-4 py-3 text-muted">{item.user}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.table}</td>
                      <td className="px-4 py-3 mono text-muted">{item.record}</td>
                      <td className="px-4 py-3 mono text-muted">{item.date}</td>
                      <td className="px-4 py-3 text-muted">{item.detail}</td>
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