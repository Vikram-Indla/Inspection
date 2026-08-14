import { useT } from "@/lib/i18n";
import type { ShellNavGroup } from "@/features/shell/types";
import ShellBrand from "../shell-brand/shell-brand";
import ShellNavGroupSection from "./shell-nav-group";
import ShellRailToggle from "./shell-rail-toggle";
import styles from "./shell-rail.module.css";

type ShellRailProps = {
  groups: readonly ShellNavGroup[];
  pathname: string;
  variant: "rail" | "drawer";
};

export default async function ShellRail({ groups, pathname, variant }: ShellRailProps) {
  const { t, locale } = await useT();
  const isRail = variant === "rail";
  const primaryLabel = t("nav.primary", locale === "ar" ? "التنقل الرئيسي" : "Primary navigation");
  const drawerLabel = t("shell.navigation", locale === "ar" ? "قائمة التنقل" : "Navigation menu");

  return (
    <nav
      className={styles.rail}
      id={isRail ? "sqx-shell-rail" : undefined}
      data-variant={variant}
      aria-label={isRail ? primaryLabel : drawerLabel}
    >
      <div className={styles.head}>
        <ShellBrand />
        {isRail ? (
          <ShellRailToggle
            collapseLabel={t("shell.collapse", locale === "ar" ? "طي القائمة" : "Collapse navigation")}
            expandLabel={t("shell.expand", locale === "ar" ? "توسيع القائمة" : "Expand navigation")}
          />
        ) : null}
      </div>

      <div className={styles.groups}>
        {groups.filter(group => !group.isAdministration).map(group => (
          <ShellNavGroupSection key={group.id} group={group} locale={locale} pathname={pathname} variant={variant} />
        ))}
      </div>

      <div className={styles.footer}>
        {groups.filter(group => group.isAdministration).map(group => (
          <ShellNavGroupSection key={group.id} group={group} locale={locale} pathname={pathname} variant={variant} />
        ))}
      </div>
    </nav>
  );
}
