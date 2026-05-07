"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";

import LogoutButton from "@/app/logout-button";
import type { CurrentUserProfile } from "@/lib/current-user-profile";

type ProtectedShellProps = {
  children: ReactNode;
  profile: CurrentUserProfile;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/pacientes", label: "Pacientes", icon: PeopleIcon },
  { href: "/vacunacion", label: "Vacunar", icon: SyringeIcon },
  { href: "/historial-vacunacion", label: "Historial Vacunacion", icon: ClipboardIcon },
  { href: "/catalogos", label: "Catalogos", icon: LibraryIcon },
  { href: "/establecimientos", label: "Establecimientos", icon: BuildingIcon },
  { href: "/usuarios", label: "Usuarios", icon: UsersIcon },
];

export default function ProtectedShell({ children, profile }: ProtectedShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const profileInitial = profile.name.slice(0, 1).toUpperCase();
  const compact = collapsed;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2eb_0%,#efe6d8_100%)] lg:flex">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 z-20 max-h-[100dvh] shrink-0 overflow-y-auto border-b border-black/5 bg-[linear-gradient(180deg,#102831_0%,#091a22_100%)] text-white shadow-[0_20px_60px_rgba(8,15,23,0.22)] transition-all duration-300 lg:h-screen lg:border-0 scrollbar-hide ${compact ? "w-full lg:w-24" : "w-full lg:w-80"}`}
      >
        <div className="absolute inset-0">
          <div className="absolute -right-20 top-10 h-52 w-52 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
        </div>

        <div className="relative flex h-full flex-col gap-4 p-3 lg:p-4">
          {/* Header con logo y botón collapse */}
          <div className="shrink-0 flex items-start justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-emerald-100 ring-1 ring-white/10">
                PAI
              </div>
              <div className={`min-w-0 transition-all duration-200 ${compact ? "w-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-100/70">Sistema nacional</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">Vacunacion integral</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
              title={collapsed ? "Expandir menu" : "Contraer menu"}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          </div>

          {/* Navigation */}
          <nav className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-1" : "grid-cols-1"}`}>
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "border-white/10 bg-white/10 text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]"
                      : "border-transparent bg-white/5 text-white/75 hover:border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${active ? "bg-white/12 text-white" : "bg-white/5 text-white/80 group-hover:bg-white/10"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`min-w-0 transition-all duration-200 ${compact ? "w-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mi Perfil button al final */}
          <div className="space-y-2">
            <Link
              href="/perfil"
              title={compact ? "Mi perfil" : undefined}
              className={`flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-300/12 px-3 py-3 text-left transition hover:bg-emerald-300/18 ${compact ? "justify-center" : ""}`}
            >
              <ProfileIcon className="h-5 w-5 shrink-0 text-emerald-100" />
              <div className={`min-w-0 transition-all duration-200 ${compact ? "w-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                <p className="text-sm font-semibold text-white">Mi Perfil</p>
              </div>
            </Link>

            <LogoutButton collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M17 20v-1.2a4.8 4.8 0 0 0-4.8-4.8H8.8A4.8 4.8 0 0 0 4 18.8V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12.4a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20v-1a4 4 0 0 0-3-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SyringeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m8 16 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 6.5 17.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 10h4l4 4v4l-4-4H6v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.5 3.5 20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 19.5V6.8A2.8 2.8 0 0 1 7.8 4H20v15.5H7.8A2.8 2.8 0 0 0 5 22.3v-2.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 11h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 20v-9h2V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3h2v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h2M13 12h2M9 16h2M13 16h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 20v-1.2A4.3 4.3 0 0 1 7.8 14.5h1.5A4.3 4.3 0 0 1 13.6 18.8V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.5 20v-.8A3.8 3.8 0 0 1 17.3 15.4h.9A3.8 3.8 0 0 1 22 19.2V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 13.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20v-1.1A5.4 5.4 0 0 1 9.9 13.5h4.2a5.4 5.4 0 0 1 5.4 5.4V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

