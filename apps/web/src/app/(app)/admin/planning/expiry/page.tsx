import ExpiryScreen from "@/components/sections/admin-planning-expiry/expiry-screen";
import { loadPlanningExpiry } from "@/features/admin-planning-expiry/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PlanningExpiryPage() {
  const [locale, data] = await Promise.all([
    getLocale(),
    loadPlanningExpiry(),
  ]);

  return <ExpiryScreen data={data} locale={locale} />;
}
