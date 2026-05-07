"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VaccineForm from "@/app/catalogos/vaccine-form";

type VaccineItem = {
  id: string;
  code: string;
  name: string;
  numeroDosis: number;
};

type SnapshotState = {
  loading: boolean;
  total: number;
  items: VaccineItem[];
  source: string;
  error: string | null;
};

export default function CatalogosPage() {
  const router = useRouter();
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [vaccines, setVaccines] = useState<SnapshotState>({
    loading: true,
    total: 0,
    items: [],
    source: "supabase",
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogs() {
      try {
        const res = await fetch("/api/catalogos/vacunas");
        const data = await res.json();

        if (cancelled) return;

        setVaccines({
          loading: false,
          total: data.total ?? (data.items?.length ?? 0),
          items: data.items ?? [],
          source: data.source ?? "supabase",
          error: res.ok ? null : data.message ?? "No se pudieron cargar vacunas",
        });
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Error desconocido";
          setVaccines((current) => ({ ...current, loading: false, error: message }));
        }
      }
    }

    loadCatalogs();
    return () => { cancelled = true; };
  }, []);

  function refreshVaccines() {
    setVaccines((s) => ({ ...s, loading: true, error: null }));
    fetch("/api/catalogos/vacunas")
      .then((r) => r.json())
      .then((data) => {
        setVaccines({
          loading: false,
          total: data.total ?? (data.items?.length ?? 0),
          items: data.items ?? [],
          source: data.source ?? "supabase",
          error: null,
        });
      })
      .catch(() => {
        setVaccines((s) => ({ ...s, loading: false, error: "Error recargando vacunas" }));
      });
  }

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        <header className="page-section">
          <p className="page-eyebrow">Modulo maestro</p>
          <h1 className="page-title">Catalogos</h1>
          <p className="page-copy">Referencias base de vacunas del sistema PAI.</p>
        </header>

        <section className="page-section">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Vacunas</h2>
            <button
              onClick={() => {
                setShowVaccineForm(!showVaccineForm);
                if (showVaccineForm) refreshVaccines();
              }}
              className="action-primary px-4 py-2"
            >
              {showVaccineForm ? "Cerrar formulario" : "Nueva vacuna"}
            </button>
          </div>

          {showVaccineForm && (
            <div className="soft-panel mb-6">
              <VaccineForm />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted">Lista de vacunas con número de dosis configuradas</p>
              <span className="mono rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted">
                Total: {vaccines.total}
              </span>
            </div>

            {vaccines.error ? <p className="form-alert-error">{vaccines.error}</p> : null}

            {vaccines.loading ? (
              <p className="text-sm text-muted">Cargando vacunas...</p>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-border bg-white/80">
                <table className="min-w-full divide-y divide-border text-left text-sm">
                  <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Nro. Dosis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vaccines.items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted">
                          No hay vacunas para mostrar.
                        </td>
                      </tr>
                    ) : (
                      vaccines.items.map((vaccine) => (
                        <tr key={vaccine.id} className="hover:bg-white">
                          <td className="px-4 py-3 mono text-muted">{vaccine.code}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{vaccine.name}</td>
                          <td className="px-4 py-3 text-muted">{vaccine.numeroDosis}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
