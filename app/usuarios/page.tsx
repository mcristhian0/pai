import Link from "next/link";
import RoleForm from "@/app/usuarios/role-form";
import { getCurrentUserContext, getRoles as getRoleOptions, getUsersSnapshot } from "@/lib/users-data";

export const dynamic = "force-dynamic";

type UsuariosPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";

  const [snapshot, roles, currentUser] = await Promise.all([getUsersSnapshot(query), getRoleOptions(), getCurrentUserContext()]);

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="page-shell">
        <header className="page-section">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="page-eyebrow">Modulo de seguridad</p>
              <h1 className="page-title">Usuarios y alcance</h1>
              <p className="page-copy">
                Gestion de usuarios por rol jerarquico y alcance territorial.
              </p>
              <Link
                href="/usuarios/new"
                className="action-primary mt-3 inline-block px-4 py-2"
              >
                Nuevo usuario
              </Link>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                snapshot.live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              Fuente: {snapshot.source}
            </span>
          </div>

          <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar usuario por nombre, email o rol"
              className="input-base"
            />
            <button type="submit" className="action-primary px-5 py-3">
              Buscar
            </button>
          </form>
        </header>

        <section className="page-section">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Usuarios registrados</h2>
            <span className="mono rounded-full border border-border bg-white/80 px-3 py-1 text-xs text-muted">
              Total: {snapshot.total.toLocaleString("es-BO")}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-white/80">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-white/70 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Alcance</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshot.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      No se encontraron usuarios para la busqueda actual.
                    </td>
                  </tr>
                ) : (
                  snapshot.items.map((user) => {
                    const currentRole = roles.find((role) => role.name === user.role)?.id ?? roles[0]?.id ?? "";

                    return (
                      <tr key={user.id} className="hover:bg-white">
                        <td className="px-4 py-3 font-medium text-accent hover:underline">
                          <Link href={`/usuarios/${user.id}`}>{user.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-muted">{user.email}</td>
                        <td className="px-4 py-3 text-muted">{user.role}</td>
                        <td className="px-4 py-3 mono text-muted">{user.level}</td>
                        <td className="px-4 py-3 text-muted">{user.scope}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.status === "Activo"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 mono text-muted">{user.createdAt}</td>
                        <td className="px-4 py-3">
                          {roles.length > 0 ? (
                            <RoleForm userId={user.id} currentRole={currentRole} roles={roles} currentUserId={currentUser?.userId} />
                          ) : (
                            <span className="text-xs text-muted">Sin roles</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}