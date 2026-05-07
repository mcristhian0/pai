import Link from "next/link";
import EstablishmentForm from "@/app/establecimientos/establishment-form";

export const dynamic = "force-dynamic";

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

export default async function NewEstablecimientoPage() {
  const municipalities = await getMunicipalities();

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        <header className="page-section">
          <p className="page-eyebrow">Modulo maestro</p>
          <h1 className="page-title">Nuevo establecimiento</h1>
          <p className="page-copy">Registra un nuevo punto de atención en la red de salud.</p>
          <Link href="/establecimientos" className="mt-2 inline-block text-sm text-accent hover:underline">
            ← Volver a establecimientos
          </Link>
        </header>

        <section className="page-section">
          <EstablishmentForm municipalities={municipalities} />
        </section>
      </div>
    </main>
  );
}
