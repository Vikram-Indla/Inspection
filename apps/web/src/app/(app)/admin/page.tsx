import Shell from "@/app/(app)/admin/_components/AdminShell";
import AdminHomeScreen from "@/components/sections/admin-home/admin-home-screen";
import { Text } from "@/components/saqeel/type";
import { loadAdminHome } from "@/features/admin-home/queries";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [locale, sb] = await Promise.all([getLocale(), supabaseServer()]);
  const data = await loadAdminHome(sb);
  const { adminHome } = getMessages(locale);

  return (
    <Shell current="/admin" title={adminHome.title} context={<Text tone="muted">{adminHome.context}</Text>}>
      <AdminHomeScreen data={data} nowMs={Date.now()} locale={locale} strings={adminHome} />
    </Shell>
  );
}
