import NotificationsSkeleton from "@/components/sections/admin-notifications/notifications-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingNotifications() {
  const locale = await getLocale();
  return <NotificationsSkeleton label={getMessages(locale).adminNotifications.loading} />;
}
