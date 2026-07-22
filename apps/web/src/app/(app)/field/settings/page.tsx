import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import FieldSettingsClient from "./FieldSettingsClient";

export default async function FieldSettingsPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");

  return (
    <Shell current="/field/settings" title={locale === "ar" ? "إعدادات الميدان" : t("field.settings.title", "Field settings")}>
      <FieldSettingsClient locale={locale} userId={user.id} />
    </Shell>
  );
}
