import { redirect } from "next/navigation";
import CalendarScreen from "@/components/sections/field-visits/calendar-screen";
import { loadFieldVisits } from "@/features/field-visits/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldVisitsCalendarPage() {
  const [locale, data] = await Promise.all([getLocale(), loadFieldVisits()]);
  if (!data) redirect("/login");

  return <CalendarScreen data={data} locale={locale} anchorNow={Date.now()} />;
}
