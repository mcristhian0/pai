"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CreateEstablishmentInput } from "@/lib/establishments-data";

type EstablishmentFormProps = {
  municipalities: Array<{ id: string; name: string }>;
  initialData?: {
    id: string;
    code: string;
    name: string;
    type: string;
    level: string;
    networkHealth: string;
    municipalityId: string;
    latitude: string;
    longitude: string;
  };
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const INITIAL_FORM: CreateEstablishmentInput = {
  code: "",
  name: "",
  type: "",
  level: "",
  networkHealth: "",
  municipalityId: "",
  latitude: "",
  longitude: "",
};

export default function EstablishmentForm({ municipalities, initialData }: EstablishmentFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateEstablishmentInput>(
    initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          type: initialData.type,
          level: initialData.level,
          networkHealth: initialData.networkHealth,
          municipalityId: initialData.municipalityId,
          latitude: initialData.latitude,
          longitude: initialData.longitude,
        }
      : INITIAL_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = initialData ? `/api/establecimientos/${initialData.id}` : "/api/establecimientos";
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
      router.push("/establecimientos");
      router.refresh();
    }, 1000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <div className={message.type === "error" ? "form-alert-error" : "form-alert-success"}>{message.text}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-base">Código *</label>
          <input
            type="text"
            required
            disabled={initialData !== undefined}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Ej: EST-LPZ-002"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Nombre *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre del establecimiento"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Tipo</label>
          <input
            type="text"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            placeholder="Ej: Centro de Salud"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Nivel de atención (1-3)</label>
          <input
            type="number"
            min={1}
            max={3}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            placeholder="1, 2 o 3"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Red de Salud</label>
          <input
            type="text"
            value={form.networkHealth}
            onChange={(e) => setForm({ ...form, networkHealth: e.target.value })}
            placeholder="Red de salud"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Municipio</label>
          <select
            value={form.municipalityId}
            onChange={(e) => setForm({ ...form, municipalityId: e.target.value })}
            className="input-base"
          >
            <option value="">Seleccionar municipio</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Latitud</label>
          <input
            type="text"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            placeholder="Ej: -16.5"
            className="input-base"
          />
        </div>

        <div>
          <label className="label-base">Longitud</label>
          <input
            type="text"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            placeholder="Ej: -68.1"
            className="input-base"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="action-primary px-6 py-2"
        >
          {loading ? "Guardando..." : initialData ? "Actualizar establecimiento" : "Crear establecimiento"}
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
