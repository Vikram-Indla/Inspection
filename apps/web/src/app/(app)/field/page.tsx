import { redirect } from "next/navigation";
import FieldHomeScreen from "@/components/sections/field-home/field-home-screen";
import { loadFieldHome } from "@/features/field-home/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldHomePage() {
  const locale = await getLocale();
  const data = await loadFieldHome(locale);
  if (!data) redirect("/login");

  return <FieldHomeScreen data={data} locale={locale} />;
}
