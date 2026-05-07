import PatientForm from "@/app/pacientes/patient-form";

export default function NewPatientPage() {
  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Nuevo registro</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Crear Paciente</h1>
            <p className="mt-2 text-sm text-muted">Registra un nuevo paciente en el sistema</p>
          </div>
          <PatientForm />
        </section>
      </div>
    </main>
  );
}
