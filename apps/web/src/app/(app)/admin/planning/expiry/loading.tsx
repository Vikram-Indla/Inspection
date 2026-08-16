import ExpirySkeleton from "@/components/experimental/planning-expiry/expiry-skeleton";
import { getLocale } from "@/lib/i18n";

export default async function PlanningExpiryLoading() {
  const locale = await getLocale();
  return <ExpirySkeleton locale={locale} />;
}
