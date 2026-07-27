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
      {/* Execution components retain touch density and offline/session
          behavior. Navigation, theme and application chrome are owned once by
          the parent AppShell for every canonical role and viewport. */}
      <link rel="stylesheet" href="/saqeel-ds/saqeel/styles.css" />
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        data-saqeel-migration="unified-execution"
        // Execution remains touch-capable at every responsive width. This
        // density profile changes control sizing, not application architecture.
        data-density="field"
        style={{
          minHeight: "100%",
          minInlineSize: 0,
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
