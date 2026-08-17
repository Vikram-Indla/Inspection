import { redirect } from "next/navigation";
import ReportsScreen from "@/components/sections/field-reports/reports-screen";
import { loadSubmittedReports } from "@/features/field-reports/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldReportsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadSubmittedReports()]);
  if (!data) redirect("/login");

  return <ReportsScreen data={data} locale={locale} />;
}
