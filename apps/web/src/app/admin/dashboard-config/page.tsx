import DashboardConfigScreen from "@/components/sections/admin-dashboard-config/dashboard-config-screen";
import { loadDashboardConfig } from "@/features/admin-dashboard-config/queries";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardConfigPage() {
  const [locale, sb] = await Promise.all([getLocale(), supabaseServer()]);
  const data = await loadDashboardConfig(sb);

  return <DashboardConfigScreen data={data} locale={locale} strings={getMessages(locale).adminDashboardConfig} />;
}
