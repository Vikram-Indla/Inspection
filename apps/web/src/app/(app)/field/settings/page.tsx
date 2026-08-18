import { redirect } from "next/navigation";
import SettingsScreen from "@/components/sections/field-settings/settings-screen";
import { loadFieldSettings } from "@/features/field-settings/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldSettingsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadFieldSettings()]);
  if (!data) redirect("/login");

  return <SettingsScreen data={data} locale={locale} />;
}
