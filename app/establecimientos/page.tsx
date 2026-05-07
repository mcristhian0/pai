import Link from "next/link";
import { getEstablishmentsSnapshot } from "@/lib/establishments-data";

export const dynamic = "force-dynamic";

type EstablecimientosPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function EstablecimientosPage({ searchParams }: EstablecimientosPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const snapshot = await getEstablishmentsSnapshot(query);

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        <header className="page-section">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="page-eyebrow">Modulo maestro</p>
              <h1 className="page-title">Establecimientos</h1>
              <p className="page-copy">Gestión de puntos de atención y cobertura territorial.</p>
              <Link href="/establecimientos/new" className="action-primary mt-3 inline-block px-4 py-2">
                Nuevo establecimiento
              </Link>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                snapshot.live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              Fuente: {snapshot.source}
            </span>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre o código"
              className="input-base"
            />
            <button type="submit" className="action-primary px-5 py-3">
              Buscar
            </button>
          </form>
        </header>

        <section className="page-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Listado de establecimientos</h2>
            <span className="mono rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted">
              Total: {snapshot.total.toLocaleString("es-BO")}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white/80">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Municipio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshot.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No se encontraron establecimientos para la búsqueda actual.
                    </td>
                  </tr>
                ) : (
                  snapshot.items.map((est) => (
                    <tr key={est.id} className="hover:bg-white">
                      <td className="px-4 py-3 mono text-muted">{est.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{est.name}</td>
                      <td className="px-4 py-3 text-muted">{est.municipality}</td>
                      <td className="px-4 py-3 text-muted">{est.type}</td>
                      <td className="px-4 py-3 text-muted">{est.level}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/establecimientos/${est.id}?edit=true`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Editar
                        </Link>
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
