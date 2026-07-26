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
import FieldShellDrawer, { type FieldDrawerGroup } from "@/components/field/FieldShellDrawer";
import { buildShellNavigation } from "@/lib/shell-navigation";

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
  const roleKeys = (roleRead.error ? [] : roleRead.data ?? []).map(row => row.role_key);
  const inspector = !roleRead.error && roleKeys.includes("inspector");
  if (!inspector) {
    redirect(`/login?reason=unauthorized&next=${encodeURIComponent(pathname)}`);
  }
  const { t, locale } = await useT();

  // Side-panel availability (Product Owner, 2026-07-26 — supersedes the
  // CC-SHELL-TABLET-001 option B reading applied here before). The panel is
  // available to EVERY persona on the field channel, matching the design
  // authority's own rule in pwa-shell.js ("burger AND sticky footer, both, for
  // every role"). The earlier build gave a field-only Inspector the bottom tab
  // bar alone, so the burger never rendered for the channel's whole audience.
  // Per-destination restrictions are deferred to a later slice by that same
  // ruling; `narrowToFieldChannel: false` opts this drawer out of the WEB
  // channel gate without touching it — TASK-WEB-CHANNEL-ACCESS-GATE-001 still
  // governs the console shell, and every destination keeps its own route guard.
  //
  // Administrator visibility (Product Owner, 2026-07-26): an item the persona
  // is not allowed is OMITTED, never rendered disabled behind "Administrator
  // access required." A control implying a capability the user does not have is
  // the UI equivalent of a plausible default. That ruling is NOT relaxed by the
  // availability ruling above: admin-advanced rows are dropped upstream and the
  // `enabled` filter below drops the admin-primary rows, so a non-admin persona
  // still gets no Administration group at all.
  const drawerGroups: FieldDrawerGroup[] = buildShellNavigation(roleKeys, { narrowToFieldChannel: false })
    .map(group => ({
      id: group.id,
      label: t(group.labelKey, locale === "ar" ? group.labelAr : group.labelEn),
      items: group.items
        .filter(item => item.enabled)
        .map(item => ({
          id: item.id,
          label: t(item.labelKey, locale === "ar" ? item.labelAr : item.labelEn),
          href: item.href,
          icon: item.icon,
        })),
    }))
    .filter(group => group.items.length > 0);
  return (
    <>
      {/* Next hoists this <link> to <head>; the DS @imports (tokens, IBM Plex
          via Google Fonts) resolve relative to styles.css under /saqeel-ds. */}
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
        <FieldShellDrawer groups={drawerGroups} strings={{
          open: t("shell.openMenu", locale === "ar" ? "فتح القائمة" : "Open menu"),
          close: t("shell.closeMenu", locale === "ar" ? "إغلاق القائمة" : "Close menu"),
          nav: t("shell.primaryNavigation", locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"),
          brandAr: "صقيل",
        }}>
          <FieldSessionBoundary>{children}</FieldSessionBoundary>
        </FieldShellDrawer>
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
