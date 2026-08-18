import LookupsScreen from "@/components/sections/admin-planning-lookups/lookups-screen";
import { loadPlanningLookups } from "@/features/admin-planning-lookups/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PlanningLookupsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadPlanningLookups()]);

  return <LookupsScreen data={data} locale={locale} />;
}
