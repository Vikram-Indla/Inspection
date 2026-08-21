import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import ProfileScreen from "@/components/sections/profile/profile-screen";
import { loadProfile } from "@/features/profile/queries";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [locale, sb] = await Promise.all([getLocale(), supabaseServer()]);
  const { data: { user } } = await getServerUser();
  if (!user) redirect("/login");

  const data = await loadProfile(sb, user.id, user.email ?? null);

  return (
    <Shell current="/profile" title="">
      <ProfileScreen data={data} locale={locale} strings={getMessages(locale).profile} />
    </Shell>
  );
}
