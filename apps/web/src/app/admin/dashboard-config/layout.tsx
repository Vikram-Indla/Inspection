import type { ReactNode } from "react";
import Shell, { AppShell } from "@/components/Shell";
import { Text } from "@/components/saqeel/type";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function DashboardConfigLayout({ children }: { children: ReactNode }) {
  const { adminDashboardConfig } = getMessages(await getLocale());

  return (
    <AppShell>
      <Shell
        current="/admin/dashboard-config"
        title={adminDashboardConfig.title}
        context={<Text tone="muted">{adminDashboardConfig.context}</Text>}
      >
        {children}
      </Shell>
    </AppShell>
  );
}
