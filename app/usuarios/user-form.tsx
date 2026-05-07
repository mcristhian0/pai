"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { CreateUserInput, RoleOption } from "@/lib/users-data";

type UserFormProps = {
  roles: RoleOption[];
  currentUserId?: string;
  currentUserRole?: string | null;
  currentUserLevel?: number;
  initialData?: {
    id: string;
    name: string;
    email: string;
    roleId: string;
    departmentId?: string;
    municipalityId?: string;
    establishmentId?: string;
  };
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const INITIAL_FORM: CreateUserInput = {
  email: "",
  name: "",
  roleId: "",
  password: "",
};

export default function UserForm({ roles, currentUserId, currentUserRole, currentUserLevel, initialData }: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateUserInput>(
    initialData
      ? {
          email: initialData.email,
          name: initialData.name,
          roleId: initialData.roleId,
          departmentId: initialData.departmentId,
          municipalityId: initialData.municipalityId,
          establishmentId: initialData.establishmentId,
        }
      : INITIAL_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [municipalities, setMunicipalities] = useState<Array<{ id: string; name: string }>>([]);
  const [establishments, setEstablishments] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch departments
    fetch("/api/locations?type=departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.items || []));

    // Fetch municipalities
    fetch("/api/locations?type=municipalities")
      .then((r) => r.json())
      .then((data) => setMunicipalities(data.items || []));

    // Fetch establishments
    fetch("/api/locations?type=establishments")
      .then((r) => r.json())
      .then((data) => setEstablishments(data.items || []));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = initialData ? `/api/usuarios/${initialData.id}` : "/api/usuarios";
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
      router.push("/usuarios");
      router.refresh();
    }, 1000);
  }

  const selectedRole = roles.find((r) => r.id === form.roleId);
  const isSelfEdit = initialData?.id !== undefined && currentUserId === initialData.id;
  const isVaccinator = currentUserRole === "VACUNADOR";
  const availableRoles = currentUserLevel !== undefined
    ? roles.filter((r) => r.level < currentUserLevel)
    : roles;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <div className={message.type === "error" ? "form-alert-error" : "form-alert-success"}>{message.text}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-base">Email *</label>
          <input
            type="email"
            required
            disabled={initialData !== undefined}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="usuario@example.com"
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
            placeholder="Nombre completo"
            className="input-base"
          />
        </div>

        {!initialData && (
          <div>
            <label className="label-base">Contraseña *</label>
            <input
              type="password"
              required
              value={form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Al menos 6 caracteres"
              className="input-base"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="label-base">Rol *</label>
          <select
            required
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            disabled={isSelfEdit}
            className="input-base"
          >
            <option value="">Seleccionar rol</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Nivel {r.level})
              </option>
            ))}
          </select>
        </div>

        {selectedRole?.name === "ADMIN_DEP" && (
          <div>
            <label className="label-base">Departamento</label>
            <select
              value={form.departmentId || ""}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value || undefined })}
              className="input-base"
            >
              <option value="">Seleccionar departamento</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRole?.name === "ADMIN_MUN" && (
          <div>
            <label className="label-base">Municipio</label>
            <select
              value={form.municipalityId || ""}
              onChange={(e) => setForm({ ...form, municipalityId: e.target.value || undefined })}
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
        )}

        {(selectedRole?.name === "VACUNADOR" || selectedRole?.name === "CONSULTA") && (
          <div>
            <label className="label-base">Establecimiento</label>
            <select
              value={form.establishmentId || ""}
              onChange={(e) => setForm({ ...form, establishmentId: e.target.value || undefined })}
              disabled={isVaccinator}
              className="input-base"
            >
              <option value="">Seleccionar establecimiento</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isVaccinator && selectedRole?.name === "VACUNADOR" ? (
          <p className="sm:col-span-2 text-xs text-muted">El alcance de establecimiento no puede editarse para VACUNADOR.</p>
        ) : null}

        {isSelfEdit ? (
          <p className="sm:col-span-2 text-xs text-muted">Tu propio rol no se puede cambiar.</p>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="action-primary px-6 py-2"
        >
          {loading ? "Guardando..." : initialData ? "Actualizar usuario" : "Crear usuario"}
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
