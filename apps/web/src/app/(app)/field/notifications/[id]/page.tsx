import { notFound, redirect } from "next/navigation";
import NotificationDetailScreen from "@/components/sections/field-notifications/notification-detail-screen";
import UnavailableNotice from "@/components/sections/field-notifications/notification-unavailable";
import { loadNotificationDetail } from "@/features/field-notifications/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldNotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [locale, { id }] = await Promise.all([getLocale(), params]);
  const result = await loadNotificationDetail(id);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return <UnavailableNotice locale={locale} />;

  return <NotificationDetailScreen detail={result.detail} locale={locale} />;
}
