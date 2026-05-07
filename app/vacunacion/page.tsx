import EventForm from "@/app/vacunacion/event-form";
import { getVaccinationOptions } from "@/lib/vaccination-data";

export const dynamic = "force-dynamic";

export default async function VacunacionPage() {
  const options = await getVaccinationOptions();

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Modulo operativo</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Vacunar</h1>
              <p className="mt-2 text-sm text-muted">
                Registro de eventos de vacunacion con validaciones de dosis, edad e intervalo.
              </p>
            </div>
          </div>
        </header>

        <section className="glass-panel rounded-[28px] p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Nuevo evento de vacunacion</h2>
          </div>
          <EventForm options={options} />
        </section>
      </div>
    </main>
  );
}