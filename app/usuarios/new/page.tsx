import { getCurrentUserContext, getRoles } from "@/lib/users-data";
import UserForm from "@/app/usuarios/user-form";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const [roles, currentUser] = await Promise.all([getRoles(), getCurrentUserContext()]);
  const currentUserLevel = roles.find((r) => r.name === currentUser?.role)?.level;

  return (
    <main className="dashboard-grid min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-400 flex-col gap-4">
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Nuevo usuario</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Crear Usuario</h1>
            <p className="mt-2 text-sm text-muted">Registra un nuevo usuario en el sistema</p>
          </div>
          <UserForm
            roles={roles}
            currentUserId={currentUser?.userId}
            currentUserRole={currentUser?.role ?? null}
            currentUserLevel={currentUserLevel}
          />
        </section>
      </div>
    </main>
  );
}
