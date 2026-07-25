import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { useT } from "@/lib/i18n";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { safeFieldReturnPath } from "@/lib/field-auth";
import FieldSessionBoundary from "@/components/field/FieldSessionBoundary";
import FieldNav, { type FieldNavKey } from "@/components/field/FieldNav";

// SAQEEL field (inspector iPad) channel layout. This segment renders its OWN
// self-contained chrome from the canonical SAQEEL field design system — the
// global AppShell topbar/sidebar is bypassed for /field paths in the parent
// (app)/layout.tsx. The design's stylesheet (public/saqeel-ds/saqeel/styles.css)
// is linked ONLY here, so its token/component layer is scoped to field routes
// and never leaks into the console/admin chrome (which stays on astryx.css).
// Each field page renders its own design header. The <FieldNav> bottom bar is
// rendered ONCE here, not per page: it was previously pasted into each page and
// 11 of the 21 field screens simply never got one, leaving an inspector with no
// way out except browser-back. The bar is WA-PWA-TAB-r1 and is persistent
// across the whole channel by design, which makes the layout its only correct
// home.
// Mirrors the design's activeKey(): the more specific sections win, and
// anything else (a visit, an inspection, the map, search) falls back to Home.
function fieldTabFor(pathname: string): FieldNavKey {
  if (pathname.startsWith("/field/my-tasks")) return "myTasks";
  if (pathname.startsWith("/field/establishments") || pathname.startsWith("/field/factory-360")) return "establishments";
  if (pathname.startsWith("/field/notifications")) return "notifications";
  if (pathname.startsWith("/field/account") || pathname.startsWith("/field/settings")) return "account";
  return "home";
}

export default async function FieldLayout({ children }: { children: ReactNode }) {
  const sb = await supabaseServer();
  const pathname = safeFieldReturnPath((await headers()).get("x-pathname"));
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) {
    redirect(`/login?reason=expired&next=${encodeURIComponent(pathname)}`);
  }
  const roleRead = await getUserRoles(user.id);
  const inspector = !roleRead.error && (roleRead.data ?? []).some(row => row.role_key === "inspector");
  if (!inspector) {
    redirect(`/login?reason=unauthorized&next=${encodeURIComponent(pathname)}`);
  }
  const { t, locale } = await useT();
  return (
    <>
      {/* Next hoists this <link> to <head>; the DS @imports (tokens, IBM Plex
          via Google Fonts) resolve relative to styles.css under /saqeel-ds. */}
      <link rel="stylesheet" href="/saqeel-ds/saqeel/styles.css" />
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
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
        <FieldNav active={fieldTabFor(pathname)} labels={{
          home: t("field.tabs.home", locale === "ar" ? "الرئيسية" : "Home"),
          myTasks: t("field.tabs.myTasks", locale === "ar" ? "مهامي" : "My Tasks"),
          establishments: t("field.tabs.establishments", locale === "ar" ? "المنشآت" : "Establishments"),
          notifications: t("field.tabs.notifications", locale === "ar" ? "الإشعارات" : "Notifications"),
          account: t("field.tabs.account", locale === "ar" ? "الحساب" : "Account"),
        }} />
      </div>
    </>
  );
}
