import NotificationsScreen from "@/components/sections/admin-notifications/notifications-screen";
import { loadNotifications } from "@/features/admin-notifications/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const [locale, data] = await Promise.all([getLocale(), loadNotifications()]);

  return <NotificationsScreen data={data} locale={locale} />;
}
