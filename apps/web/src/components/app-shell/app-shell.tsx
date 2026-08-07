import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getShellView } from "@/features/shell/queries";
import { useT } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import ShellMobileNav from "./shell-mobile-nav/shell-mobile-nav";
import ShellRail from "./shell-rail/shell-rail";
import ShellTopbar from "./shell-topbar/shell-topbar";
import styles from "./app-shell.module.css";

export default async function AppShell({ children }: { children: ReactNode }) {
  const [view, { t, locale }] = await Promise.all([getShellView(), useT()]);
  if (!view) redirect(localeHref(locale, "/login"));
  const ar = locale === "ar";

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        {t("shell.skip", ar ? "الانتقال إلى المحتوى" : "Skip to content")}
      </a>

      <ShellRail groups={view.groups} pathname={view.pathname} variant="rail" />

      <div className={styles.body}>
        <ShellTopbar
          view={view}
          mobileNav={
            <ShellMobileNav
              strings={{
                open: t("shell.openMenu", ar ? "فتح قائمة التنقل" : "Open navigation"),
                close: t("shell.closeMenu", ar ? "إغلاق قائمة التنقل" : "Close navigation"),
                navigation: t("shell.navigation", ar ? "قائمة التنقل" : "Navigation menu"),
              }}
            >
              <ShellRail groups={view.groups} pathname={view.pathname} variant="drawer" />
            </ShellMobileNav>
          }
        />
        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
