import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import ProtectedShell from "@/app/protected-shell";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/current-user-profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PAI Vacunacion",
  description: "Sistema integral de vacunacion con control territorial, lotes y auditoria.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getCurrentUserProfile(user.id, user.email ?? null) : null;

  if (user && !profile) {
    redirect("/api/auth/logout");
  }

  return (
    <html lang="es" className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}>
      <body className="min-h-screen">
        {profile ? <ProtectedShell profile={profile}>{children}</ProtectedShell> : children}
      </body>
    </html>
  );
}
