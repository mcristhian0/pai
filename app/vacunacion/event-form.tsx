"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { VaccinationOptions } from "@/lib/vaccination-data";

type EventFormProps = {
  options: VaccinationOptions;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function initialForm() {
  return {
    patientId: "",
    vaccineId: "",
    doseId: "",
    establishmentId: "",
    loteText: "",
    vaccinationDate: todayISO(),
    route: "",
    ageDays: "",
    temperature: "",
    observations: "",
    ciInput: "",
    patientLabel: "",
    ciSearching: false,
    ciError: "",
  };
}

export default function EventForm({ options }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const availableDoses = useMemo(
    () => options.doses.filter((dose) => !form.vaccineId || dose.vaccineId === form.vaccineId),
    [options.doses, form.vaccineId],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!form.patientId) {
      setMessage({
        type: "error",
        text: "Selecciona un paciente primero",
      });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/vacunacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        vaccineId: form.vaccineId,
        doseId: form.doseId,
        establishmentId: form.establishmentId,
        loteText: form.loteText,
        vaccinationDate: form.vaccinationDate,
        route: form.route,
        ageDays: form.ageDays,
        temperature: form.temperature,
        observations: form.observations,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; message?: string; id?: string };

    if (!response.ok || !payload.ok) {
      setMessage({
        type: "error",
        text: payload.message ?? "No se pudo crear el evento de vacunacion.",
      });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: `Evento creado correctamente (${payload.id ?? "sin id"}).`,
    });
    setForm(initialForm());
    setLoading(false);
    router.refresh();
  }

  async function searchPatientByCi() {
    if (!form.ciInput.trim()) {
      setForm((prev) => ({ ...prev, ciError: "Ingresa un CI" }));
      return;
    }

    setForm((prev) => ({ ...prev, ciSearching: true, ciError: "" }));

    try {
      const response = await fetch(`/api/pacientes/by-ci?ci=${encodeURIComponent(form.ciInput.trim())}`);
      const data = await response.json();

      if (!data.ok) {
        setForm((prev) => ({
          ...prev,
          ciError: data.message || "No se encontró paciente",
          ciSearching: false,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        patientId: data.patient.id,
        patientLabel: `${data.patient.fullName} (${data.patient.ci})`,
        ciError: "",
        ciSearching: false,
      }));
    } catch (error) {
      setForm((prev) => ({
        ...prev,
        ciError: "Error al buscar paciente",
        ciSearching: false,
      }));
    }
  }

  function clearPatient() {
    setForm((prev) => ({
      ...prev,
      ciInput: "",
      patientId: "",
      patientLabel: "",
      ciError: "",
    }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        <label>Paciente (CI)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.ciInput}
            onChange={(event) => setForm((prev) => ({ ...prev, ciInput: event.target.value, ciError: "" }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPatientByCi())}
            placeholder="Ingresa CI del paciente"
            disabled={form.patientId !== ""}
            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground disabled:opacity-50"
          />
          {form.patientId ? (
            <button
              type="button"
              onClick={clearPatient}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-white/80"
            >
              Cambiar
            </button>
          ) : (
            <button
              type="button"
              onClick={searchPatientByCi}
              disabled={form.ciSearching}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {form.ciSearching ? "..." : "Buscar"}
            </button>
          )}
        </div>
        {form.ciError && <p className="text-xs text-rose-600 mt-1">{form.ciError}</p>}
        {form.patientLabel && <p className="text-xs text-emerald-600 mt-1">✓ {form.patientLabel}</p>}
      </div>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Vacuna
        <select
          value={form.vaccineId}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              vaccineId: event.target.value,
              doseId: "",
            }))
          }
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
          required
        >
          <option value="">Selecciona vacuna</option>
          {options.vaccines.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Dosis
        <select
          value={form.doseId}
          onChange={(event) => setForm((prev) => ({ ...prev, doseId: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
          required
        >
          <option value="">Selecciona dosis</option>
          {availableDoses.map((option) => (
            <option key={`${option.vaccineId}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Establecimiento
        <select
          value={form.establishmentId}
          onChange={(event) => setForm((prev) => ({ ...prev, establishmentId: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
          required
        >
          <option value="">Selecciona establecimiento</option>
          {options.establishments.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Lote de vacuna
        <input
          type="text"
          value={form.loteText}
          onChange={(event) => setForm((prev) => ({ ...prev, loteText: event.target.value }))}
          placeholder="Ej: LOT-2025-001"
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Fecha de vacunacion
        <input
          type="date"
          value={form.vaccinationDate}
          onChange={(event) => setForm((prev) => ({ ...prev, vaccinationDate: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Via de aplicacion
        <input
          type="text"
          value={form.route}
          onChange={(event) => setForm((prev) => ({ ...prev, route: event.target.value }))}
          placeholder="Intramuscular / Oral"
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Edad en dias
        <input
          type="number"
          min={0}
          value={form.ageDays}
          onChange={(event) => setForm((prev) => ({ ...prev, ageDays: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Temperatura (C)
        <input
          type="number"
          step="0.1"
          value={form.temperature}
          onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
        />
      </label>

      <label className="md:col-span-2 flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
        Observaciones
        <textarea
          rows={3}
          value={form.observations}
          onChange={(event) => setForm((prev) => ({ ...prev, observations: event.target.value }))}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
        />
      </label>

      <div className="md:col-span-2 flex items-center justify-between gap-3">
        {message ? (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {message.text}
          </p>
        ) : (
          <span className="text-sm text-muted">Las validaciones clinicas se verifican antes de guardar.</span>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setForm(initialForm()); setMessage(null); }}
            className="rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/80"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Guardando..." : "Registrar evento"}
          </button>
        </div>
      </div>
    </form>
  );
}
