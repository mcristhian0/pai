import Link from "next/link";
import { getEstablishmentDetail } from "@/lib/establishments-data";
import EstablishmentForm from "@/app/establecimientos/establishment-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ edit?: string }>;
};

async function getMunicipalities() {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const client = await createServerSupabaseClient();
    const { data } = await client
      .from("municipio")
      .select("municipio_id, nombre_municipio")
      .order("nombre_municipio");
    return (data ?? []).map((m: { municipio_id: string; nombre_municipio: string }) => ({
      id: m.municipio_id,
      name: m.nombre_municipio,
    }));
  } catch {
    return [];
  }
}

export default async function EstablecimientoDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isEditing = sp?.edit === "true";

  const [detail, municipalities] = await Promise.all([
    getEstablishmentDetail(id),
    getMunicipalities(),
  ]);

  if (!detail) {
    return (
      <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="page-shell">
          <div className="page-section text-center">
            <p className="text-muted">Establecimiento no encontrado</p>
            <Link href="/establecimientos" className="mt-4 inline-block text-accent hover:underline">
              Volver a establecimientos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        {isEditing ? (
          <>
            <header className="page-section">
              <p className="page-eyebrow">Modulo maestro</p>
              <h1 className="page-title">Editar establecimiento</h1>
              <Link href="/establecimientos" className="mt-2 inline-block text-sm text-accent hover:underline">
                ← Volver a establecimientos
              </Link>
            </header>
            <section className="page-section">
              <EstablishmentForm
                municipalities={municipalities}
                initialData={{
                  id: detail.id,
                  code: detail.code,
                  name: detail.name,
                  type: detail.type,
                  level: detail.level,
                  networkHealth: detail.networkHealth,
                  municipalityId: detail.municipalityId,
                  latitude: detail.latitude,
                  longitude: detail.longitude,
                }}
              />
            </section>
          </>
        ) : (
          <>
            <header className="page-section">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="page-eyebrow">Detalle del establecimiento</p>
                  <h1 className="page-title">{detail.name}</h1>
                  <p className="page-copy mono">{detail.code}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/establecimientos/${id}?edit=true`}
                    className="action-primary px-5 py-2"
                  >
                    Editar
                  </Link>
                  <Link
                    href="/establecimientos"
                    className="rounded-2xl border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground hover:bg-white/80"
                  >
                    Volver
                  </Link>
                </div>
              </div>
            </header>

            <section className="page-section">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Tipo", value: detail.type || "-" },
                  { label: "Nivel", value: detail.level || "-" },
                  { label: "Red de salud", value: detail.networkHealth || "-" },
                  { label: "Municipio ID", value: detail.municipalityId || "-" },
                  { label: "Latitud", value: detail.latitude || "-" },
                  { label: "Longitud", value: detail.longitude || "-" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-white/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
