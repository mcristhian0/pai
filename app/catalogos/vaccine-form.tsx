"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type VaccineFormProps = {
  vaccineId?: string;
  initialData?: {
    code: string;
    name: string;
  };
};

export default function VaccineForm({ vaccineId, initialData }: VaccineFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const numeroDosis = parseInt(formData.get("numeroDosis") as string, 10) || 1;

    try {
      const method = vaccineId ? "PATCH" : "POST";
      const url = vaccineId ? `/api/catalogos/vacunas/${vaccineId}` : "/api/catalogos/vacunas";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(method === "POST" && { cod_vacuna: code }),
          nombre: name,
          numero_dosis: numeroDosis,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Error al guardar vacuna" });
        return;
      }

      setMessage({ type: "success", text: vaccineId ? "Vacuna actualizada" : "Vacuna creada" });
      setTimeout(() => {
        router.push("/catalogos?tab=vacunas");
        router.refresh();
      }, 800);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="label-base">
          Código de Vacuna
        </label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={initialData?.code ?? ""}
          disabled={!!vaccineId}
          placeholder="ej. VAC-001"
          required
          className="input-base mt-2"
        />
      </div>

      <div>
        <label htmlFor="name" className="label-base">
          Nombre de Vacuna
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name ?? ""}
          placeholder="ej. BCG"
          required
          className="input-base mt-2"
        />
      </div>

      <div>
        <label htmlFor="numeroDosis" className="label-base">
          Número de dosis requeridas
        </label>
        <input
          id="numeroDosis"
          name="numeroDosis"
          type="number"
          min={1}
          max={10}
          defaultValue={(initialData as any)?.numeroDosis ?? 1}
          required
          className="input-base mt-2"
        />
      </div>

      {message && (
        <div className={message.type === "success" ? "form-alert-success" : "form-alert-error"}>{message.text}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="action-primary w-full px-4 py-3"
      >
        {loading ? "Guardando..." : vaccineId ? "Actualizar vacuna" : "Crear vacuna"}
      </button>
    </form>
  );
}
