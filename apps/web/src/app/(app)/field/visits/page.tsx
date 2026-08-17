import { redirect } from "next/navigation";
import VisitsScreen from "@/components/sections/field-visits/visits-screen";
import { loadFieldVisits } from "@/features/field-visits/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldVisitsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadFieldVisits()]);
  if (!data) redirect("/login");

  return <VisitsScreen data={data} locale={locale} now={Date.now()} />;
}
