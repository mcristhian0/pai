"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { RoleOption } from "@/lib/users-data";

type RoleFormProps = {
  userId: string;
  currentRole: string;
  roles: RoleOption[];
  currentUserId?: string;
};

export default function RoleForm({ userId, currentRole, roles, currentUserId }: RoleFormProps) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const isSelf = currentUserId === userId;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roleId }),
    });

    const payload = (await response.json()) as { ok?: boolean; message?: string };

    if (!response.ok || !payload.ok) {
      setMessage(payload.message ?? "No se pudo actualizar el rol.");
      setLoading(false);
      return;
    }

    setMessage("Rol actualizado");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select
        value={roleId}
        onChange={(event) => setRoleId(event.target.value)}
        disabled={isSelf}
        className="rounded-lg border border-border bg-white px-2 py-1 text-xs text-foreground"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || isSelf}
        className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "..." : "Guardar"}
      </button>
      {isSelf ? <span className="text-xs text-muted">Tu propio rol no se puede cambiar</span> : null}
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </form>
  );
}