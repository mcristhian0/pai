import Link from "next/link";

import { navigation } from "@/lib/dashboard-data";
import { getDashboardSnapshot } from "@/lib/dashboard-snapshot";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardSnapshot();
  const fmtPercent = (value: number) => `${value}%`;

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <aside className="hidden glass-panel relative overflow-hidden rounded-[28px] border border-black/5 px-5 py-6 text-white shadow-[0_20px_60px_rgba(8,15,23,0.22)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#11323a_0%,#0b1d25_100%)]" />
          <div className="absolute -right-16 top-10 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
          <div className="relative flex h-full flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-lg font-semibold text-emerald-100 ring-1 ring-white/10">
                PAI
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-100/70">
                  Sistema nacional
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-white">
                  Vacunacion integral
                </h1>
              </div>
            </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                Rol activo
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold">ADMIN_NAL</p>
                  <p className="text-sm text-white/65">Alcance nacional con auditoria</p>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/12 px-3 py-1 text-xs font-medium text-emerald-100">
                  Online
                </span>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={
                    item.label === "Pacientes"
                      ? "/pacientes"
                      : item.label === "Vacunacion"
                        ? "/vacunacion"
                        : item.label === "Catalogos"
                          ? "/catalogos"
                          : item.label === "Usuarios"
                            ? "/usuarios"
                            : item.label === "Auditoria"
                              ? "/auditoria"
                          : "#"
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    item.active
                      ? "border-white/10 bg-white/10 text-white"
                      : "border-transparent bg-white/5 text-white/70 hover:border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-white/50">00{item.active ? "1" : "2"}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Sincronizacion</p>
                <p className="text-xs text-emerald-200">Activa</p>
              </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[82%] rounded-full bg-linear-to-r from-emerald-300 via-cyan-300 to-amber-200" />
              </div>
              <p className="text-sm text-white/65">
                Seeds cargadas y listas para el primer recorrido funcional.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <header className="glass-panel flex flex-col gap-4 rounded-[28px] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">
                Panel operativo
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Control de vacunacion, alcance y auditoria
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex min-w-70 items-center gap-3 rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-muted shadow-sm backdrop-blur">
                <span className="text-base">⌕</span>
                <span>Buscar paciente, lote, vacuna o establecimiento</span>
              </label>
              <button
                type="button"
                className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)] transition hover:brightness-110"
              >
                Nuevo evento
              </button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {dashboard.metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="glass-panel rounded-[26px] p-5 transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted">{metric.label}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                          {metric.value}
                        </p>
                      </div>
                      <div
                        className={`h-12 w-12 rounded-2xl border text-xs font-semibold ${
                          metric.tone === "emerald"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : metric.tone === "amber"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : metric.tone === "cyan"
                                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                        } flex items-center justify-center`}
                      >
                        {metric.value.replace(/[^\d%]/g, "").slice(0, 3) || "KP"}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted">{metric.delta}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <article className="glass-panel rounded-[28px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">
                        Cobertura por territorio
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">
                        Mapa operativo de avance
                      </h3>
                    </div>
                    <span className="rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-medium text-muted">
                      Actualizado hace 10 min
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {dashboard.coverage.map((row) => (
                      <div key={row.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{row.label}</span>
                          <span className="mono text-muted">{row.value}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white/70">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-accent via-emerald-400 to-amber-300"
                            style={{ width: fmtPercent(row.percent) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="glass-panel rounded-[28px] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">
                        Tareas y alertas
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">
                        Operacion diaria
                      </h3>
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      4 pendientes
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {dashboard.timeline.map((item) => (
                      <div key={item.title} className="rounded-[22px] border border-border bg-white/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.title}</p>
                            <p className="mt-1 text-sm text-muted">{item.detail}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === "ready"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "alert"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.meta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="glass-panel rounded-[28px] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">
                      Ultimos eventos
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      Registro de vacunacion reciente
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="rounded-full border border-border bg-white/80 px-3 py-1">
                      Filtros activos
                    </span>
                    <span className="rounded-full border border-border bg-white/80 px-3 py-1">
                      Solo completos
                    </span>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-white/75">
                  <table className="min-w-full divide-y divide-border text-left text-sm">
                    <thead className="bg-white/60 text-xs uppercase tracking-[0.2em] text-muted">
                      <tr>
                        <th className="px-4 py-3">Paciente</th>
                        <th className="px-4 py-3">Vacuna</th>
                        <th className="px-4 py-3">Establecimiento</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Dosis</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.recentEvents.map((event) => (
                        <tr key={`${event.patient}-${event.date}`} className="align-top transition hover:bg-white/80">
                          <td className="px-4 py-4 font-medium text-foreground">
                            {event.patient}
                          </td>
                          <td className="px-4 py-4 text-muted">{event.vaccine}</td>
                          <td className="px-4 py-4 text-muted">{event.facility}</td>
                          <td className="px-4 py-4 mono text-muted">{event.date}</td>
                          <td className="px-4 py-4 text-muted">{event.dose}</td>
                          <td className="px-4 py-4">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <aside className="space-y-4">
              <article className="glass-panel rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">
                      Alertas
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      Reglas de control
                    </h3>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    4
                  </span>
                </div>

                <ul className="mt-5 space-y-3">
                    {dashboard.alerts.map((alert) => (
                    <li key={alert} className="rounded-[20px] border border-border bg-white/70 px-4 py-3 text-sm text-foreground">
                      {alert}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="glass-panel rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">
                      Catalogo
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      Vacunas trazadas
                    </h3>
                  </div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    25 reglas
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {dashboard.vaccineCatalog.map((vaccine) => (
                    <div key={vaccine.code} className="rounded-[20px] border border-border bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{vaccine.name}</p>
                          <p className="mt-1 mono text-xs text-muted">{vaccine.code}</p>
                        </div>
                        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                          {vaccine.doses} dosis
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted">{vaccine.route}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-panel rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">
                      Red
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      Establecimientos activos
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    4 vistos
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {dashboard.facilities.map((facility) => (
                    <div key={facility.name} className="rounded-[20px] border border-border bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{facility.name}</p>
                          <p className="mt-1 text-sm text-muted">
                            {facility.municipality} / {facility.level}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            facility.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {facility.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </section>
      </div>
    </main>
  );
}
