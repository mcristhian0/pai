import Link from "next/link";
import { getCurrentUserContext, getRoles, getUserDetail } from "@/lib/users-data";
import UserForm from "@/app/usuarios/user-form";

export const dynamic = "force-dynamic";

type UserDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isEditing = sp?.edit === "true";

  const [result, roles, currentUser] = await Promise.all([getUserDetail(id), getRoles(), getCurrentUserContext()]);

  if (!result) {
    return (
      <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
          <div className="glass-panel rounded-[28px] p-5 text-center">
            <p className="text-muted">Usuario no encontrado</p>
            <Link href="/usuarios" className="mt-4 inline-block text-accent hover:underline">
              Volver a usuarios
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { user, departmentId, municipalityId, establishmentId } = result;

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        {isEditing ? (
          <section className="glass-panel rounded-[28px] p-5 sm:p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-foreground">Editar Usuario</h1>
              <p className="mt-1 text-sm text-muted">Actualiza los datos del usuario</p>
            </div>
            <UserForm
              roles={roles}
              currentUserId={currentUser?.userId}
              currentUserRole={currentUser?.role ?? null}
              currentUserLevel={roles.find((r) => r.name === currentUser?.role)?.level}
              initialData={{
                id,
                name: user.name,
                email: user.email,
                roleId: user.role,
                departmentId: departmentId ?? undefined,
                municipalityId: municipalityId ?? undefined,
                establishmentId: establishmentId ?? undefined,
              }}
            />
          </section>
        ) : (
          <>
            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Detalle del usuario</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{user.name}</h1>
                  <p className="mt-2 text-sm text-muted">Email: {user.email}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/usuarios/${id}?edit=true`}
                    className="rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(15,118,110,0.22)]"
                  >
                    Editar
                  </Link>
                  <Link
                    href="/usuarios"
                    className="rounded-2xl border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground hover:bg-white/80"
                  >
                    Volver
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Rol</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{user.role}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Alcance</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{user.scope}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Estado</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{user.status}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
