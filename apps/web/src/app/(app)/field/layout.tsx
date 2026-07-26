import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { useT } from "@/lib/i18n";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { safeFieldReturnPath } from "@/lib/field-auth";
import FieldSessionBoundary from "@/components/field/FieldSessionBoundary";

export default async function FieldLayout({ children }: { children: ReactNode }) {
  const sb = await supabaseServer();
  const pathname = safeFieldReturnPath((await headers()).get("x-pathname"));
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) {
    redirect(`/login?reason=expired&next=${encodeURIComponent(pathname)}`);
  }
  const roleRead = await getUserRoles(user.id);
  const roleKeys = (roleRead.error ? [] : roleRead.data ?? []).map(row => row.role_key);
  const inspector = !roleRead.error && roleKeys.includes("inspector");
  if (!inspector) {
    redirect(`/login?reason=unauthorized&next=${encodeURIComponent(pathname)}`);
  }
  const { locale } = await useT();
  return (
    <>
      {/* Field components keep their touch-density and offline/session behavior,
          but navigation is now owned once by the parent AppShell. */}
      <link rel="stylesheet" href="/saqeel-ds/saqeel/styles.css" />
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        // Field is a touch-first iPad channel: opt into the pre-authored "field"
        // density profile (tokens.css) so small and icon controls resolve to the
        // 40/44px touch floor instead of the 28/32px desktop metrics. The profile
        // was authored for exactly this root but had never been wired onto it.
        data-density="field"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-canvas)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        <FieldSessionBoundary>{children}</FieldSessionBoundary>
      </div>
    </>
  );
}
