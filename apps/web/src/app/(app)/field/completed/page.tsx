import { redirect } from "next/navigation";
import CompletedScreen from "@/components/sections/field-completed/completed-screen";
import { loadCompletedHistory } from "@/features/field-completed/queries";
import { getLocale } from "@/lib/i18n";

export default async function CompletedInspectionsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadCompletedHistory()]);
  if (!data) redirect("/login");

  return <CompletedScreen data={data} locale={locale} />;
}
