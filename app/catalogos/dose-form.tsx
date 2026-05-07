"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DoseFormProps = {
  doseId?: number;
  initialData?: {
    vaccineId: number;
    doseNumber: number;
  };
};

type VaccineOption = {
  id: number;
  code: string;
  name: string;
};

export default function DoseForm({ doseId, initialData }: DoseFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [vaccines, setVaccines] = useState<VaccineOption[]>([]);
  const [vaccinesLoading, setVaccinesLoading] = useState(true);

  useEffect(() => {
    async function loadVaccines() {
      try {
        const res = await fetch("/api/catalogos/vacunas?list=true");
        const data = await res.json();
        setVaccines(data.items ?? []);
      } catch (error) {
        console.error("Error loading vaccines:", error);
      } finally {
        setVaccinesLoading(false);
      }
    }

    loadVaccines();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const vaccineId = parseInt(formData.get("vaccineId") as string);
    const doseNumber = parseInt(formData.get("doseNumber") as string);

    try {
      const method = doseId ? "PATCH" : "POST";
      const url = doseId ? `/api/catalogos/dosis/${doseId}` : "/api/catalogos/dosis";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(method === "POST" && { id_vacuna: vaccineId }),
          nro_dosis: doseNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Error al guardar dosis" });
        return;
      }

      setMessage({ type: "success", text: doseId ? "Dosis actualizada" : "Dosis creada" });
      setTimeout(() => {
        router.push("/catalogos?tab=dosis");
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
        <label htmlFor="vaccineId" className="label-base">
          Vacuna
        </label>
        <select
          id="vaccineId"
          name="vaccineId"
          defaultValue={initialData?.vaccineId ?? ""}
          disabled={!!doseId || vaccinesLoading}
          required
          className="input-base mt-2"
        >
          <option value="">
            {vaccinesLoading ? "Cargando vacunas..." : "Seleccionar vacuna"}
          </option>
          {vaccines.map((vaccine) => (
            <option key={vaccine.id} value={vaccine.id}>
              {vaccine.code} - {vaccine.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="doseNumber" className="label-base">
          Número de Dosis
        </label>
        <input
          id="doseNumber"
          name="doseNumber"
          type="number"
          min="1"
          max="10"
          defaultValue={initialData?.doseNumber ?? ""}
          placeholder="ej. 1"
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
        {loading ? "Guardando..." : doseId ? "Actualizar dosis" : "Crear dosis"}
      </button>
    </form>
  );
}
