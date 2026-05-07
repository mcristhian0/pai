"use client";

import { useState } from "react";

import { signIn } from "./actions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel mx-auto w-full max-w-md rounded-[28px] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Autenticacion</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Iniciar sesion</h1>
      <p className="mt-2 text-sm text-muted">
        Ingresa con tu usuario del sistema PAI para acceder a modulos protegidos.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1 text-xs uppercase tracking-[0.16em] text-muted">
          Correo
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
            placeholder="admin@pai.gob.bo"
          />
        </label>

        <label className="grid gap-1 text-xs uppercase tracking-[0.16em] text-muted">
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm normal-case text-foreground"
            placeholder="••••••••"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>
    </form>
  );
}
