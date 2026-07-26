import type { ReactNode } from "react";
import Shell, { AppShell } from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function DashboardConfigLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = await useT();

  return (
    <AppShell>
      <Shell
        current="/admin/dashboard-config"
        title={t("admin.dashboardConfig.title", "Dashboard KPI configuration")}
      >
        {children}
      </Shell>
    </AppShell>
  );
}
