import type { ReactNode } from "react";
import Shell, { AppShell } from "@/components/Shell";
import { useT } from "@/lib/i18n";

export default async function ExecutionAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = await useT();

  return (
    <AppShell>
      <Shell
        current="/admin/execution"
        title={t("admin.execution.title", "Execution Settings")}
      >
        {children}
      </Shell>
    </AppShell>
  );
}
