import type { ComponentProps } from "react";
import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";

type AdminShellProps = ComponentProps<typeof Shell>;

export default async function AdminShell({
  children,
  current,
  title,
  context,
  topbar,
}: AdminShellProps) {
  const { t } = await useT();

  return (
    <Shell current={current} title={title} context={context} topbar={topbar}>
      <div className="stack" data-saqeel-admin-destination={current}>
        <header className="page-header">
          <nav className="breadcrumb" aria-label={t("admin.breadcrumb", "Breadcrumb")}>
            <span>{t("nav.administration", "Administration")}</span>
            <span className="sep" aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>
        </header>
        {children}
      </div>
    </Shell>
  );
}
