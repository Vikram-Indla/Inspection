import OperationsScreen from "@/components/sections/admin-operations/operations-screen";
import { loadOperations } from "@/features/admin-operations/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PlatformOperationsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadOperations()]);
  return <OperationsScreen data={data} locale={locale} />;
}
