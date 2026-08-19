import IntegrationsScreen from "@/components/sections/admin-integrations/integrations-screen";
import { loadIntegrations } from "@/features/admin-integrations/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadIntegrations()]);

  return <IntegrationsScreen data={data} locale={locale} />;
}
