import { redirect } from "next/navigation";
import NotificationsScreen from "@/components/sections/field-notifications/notifications-screen";
import { loadFieldNotifications } from "@/features/field-notifications/queries";
import { getLocale } from "@/lib/i18n";

export default async function FieldNotificationsPage({ searchParams }: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [locale, params, data] = await Promise.all([getLocale(), searchParams, loadFieldNotifications()]);
  if (!data) redirect("/login");

  return <NotificationsScreen data={data} locale={locale} filter={params.filter === "unread" ? "unread" : "all"} />;
}
