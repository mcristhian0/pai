import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUserProfile } from "@/lib/current-user-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user.id, user.email ?? null);
  if (!profile) {
    redirect("/login");
  }

  const initial = profile.name.slice(0, 1).toUpperCase();

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Cuenta y acceso</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Mi perfil</h1>
          <p className="mt-2 text-sm text-muted">
            Vista básica de la cuenta autenticada y acceso a cierre de sesión.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <article className="glass-panel rounded-[28px] p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-accent-soft text-2xl font-semibold text-accent">
                {initial}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted">Usuario</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{profile.name}</h2>
                <p className="mt-1 text-sm text-muted">{profile.email}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Rol</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{profile.roleName}</p>
                <p className="mt-1 text-xs text-muted">Nivel {profile.roleLevel}</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Alcance</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{profile.scope}</p>
                <p className="mt-1 text-xs text-muted">{profile.active ? "Cuenta activa" : "Cuenta inactiva"}</p>
              </div>
            </div>
          </article>

          <article className="glass-panel rounded-[28px] p-5">
            <h2 className="text-lg font-semibold text-foreground">Accesos rapidos</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/" className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-white">
                Ir al dashboard
              </Link>
              <Link href="/usuarios" className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm font-medium text-foreground hover:bg-white">
                Ver usuarios
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
