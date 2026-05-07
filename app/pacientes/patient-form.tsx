"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { CreatePatientInput } from "@/lib/patients-data";

type PatientFormProps = {
  initialData?: {
    id: string;
    ci: string;
    ciComp: string;
    names: string;
    apPaterno: string;
    apMaterno: string;
    sex: string;
    birthDate: string;
    isIndigenous: boolean;
    municipioId?: string;
  };
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const INITIAL_FORM: CreatePatientInput = {
  ci: "",
  ciComp: "",
  names: "",
  apPaterno: "",
  apMaterno: "",
  sex: "M",
  birthDate: "",
  isIndigenous: false,
  municipioId: "",
};

export default function PatientForm({ initialData }: PatientFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreatePatientInput>(
    initialData
      ? {
          ci: initialData.ci,
          ciComp: initialData.ciComp,
          names: initialData.names,
          apPaterno: initialData.apPaterno,
          apMaterno: initialData.apMaterno,
          sex: initialData.sex,
          birthDate: initialData.birthDate,
          isIndigenous: initialData.isIndigenous,
          municipioId: initialData.municipioId,
        }
      : INITIAL_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [municipalities, setMunicipalities] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/locations?type=municipalities")
      .then((r) => r.json())
      .then((data) => {
        const items: Array<{ id: string; name: string }> = data.items || [];
        setMunicipalities(items);
        // Si hay un solo municipio disponible, pre-seleccionarlo
        if (items.length === 1 && !initialData) {
          setForm((prev) => ({ ...prev, municipioId: items[0].id }));
        }
      })
      .catch(() => setMunicipalities([]));
  }, [initialData]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = initialData ? `/api/pacientes/${initialData.id}` : "/api/pacientes";
    const method = initialData ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { ok: boolean; message: string };

    if (!response.ok || !data.ok) {
      setMessage({
        type: "error",
        text: data.message || "Error en la operación",
      });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: data.message,
    });

    setTimeout(() => {
      router.push("/pacientes");
      router.refresh();
    }, 1000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <div className={message.type === "error" ? "form-alert-error" : "form-alert-success"}>{message.text}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-base">CI *</label>
          <input
            type="text"
            required
            disabled={initialData !== undefined}
            value={form.ci}
            onChange={(e) => setForm({ ...form, ci: e.target.value })}
            placeholder="Ej: 17485207"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Complemento CI</label>
          <input
            type="text"
            value={form.ciComp}
            onChange={(e) => setForm({ ...form, ciComp: e.target.value })}
            placeholder="Ej: LP"
            className="input-base"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-base">Nombres *</label>
          <input
            type="text"
            required
            value={form.names}
            onChange={(e) => setForm({ ...form, names: e.target.value })}
            placeholder="Nombres"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Apellido Paterno</label>
          <input
            type="text"
            value={form.apPaterno}
            onChange={(e) => setForm({ ...form, apPaterno: e.target.value })}
            placeholder="Apellido paterno"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Apellido Materno</label>
          <input
            type="text"
            value={form.apMaterno}
            onChange={(e) => setForm({ ...form, apMaterno: e.target.value })}
            placeholder="Apellido materno"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Sexo</label>
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="input-base"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div>
          <label className="label-base">Fecha de Nacimiento *</label>
          <input
            type="date"
            required
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Municipio *</label>
          <select
            required
            value={form.municipioId || ""}
            onChange={(e) => setForm({ ...form, municipioId: e.target.value || undefined })}
            className="input-base"
          >
            <option value="" disabled>Seleccionar municipio</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isIndigenous}
              onChange={(e) => setForm({ ...form, isIndigenous: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-medium text-foreground">Es indígena</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="action-primary px-6 py-2"
        >
          {loading ? "Guardando..." : initialData ? "Actualizar paciente" : "Crear paciente"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="action-secondary px-6 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
