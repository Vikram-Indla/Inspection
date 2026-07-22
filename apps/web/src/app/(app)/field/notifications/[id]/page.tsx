import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { notificationPayloadEntries, notificationReadPatch } from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// PLAN v7 item 2 · MVP1-M03-001 · AC-0099
// Notification payloads are event-specific JSON. This route deliberately
// renders stored keys generically instead of imposing an invented schema.
export default async function FieldNotificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const { data: notification, error: readError } = await sb
    .from("notifications")
    .select("id, event_key, payload, delivery_state, read_at, created_at")
    .eq("id", id)
    .eq("recipient", user.id)
    .maybeSingle();

  if (readError) {
    console.error("[field notification detail read]", readError.message, readError.code);
    return (
      <Shell current="/field" title={tr("field.notification.title", "Notification details", "تفاصيل الإشعار")}>
        <div className="ax-banner ax-banner--critical" role="alert">
          {tr("field.notification.unavailable", "This notification is temporarily unavailable. Try again.", "هذا الإشعار غير متاح مؤقتًا. حاول مرة أخرى.")}
        </div>
      </Shell>
    );
  }
  if (!notification) notFound();

  let receiptError = false;
  if (!notification.read_at) {
    const patch = notificationReadPatch(notification.delivery_state, new Date().toISOString());
    const { data, error } = await sb
      .from("notifications")
      .update(patch)
      .eq("id", notification.id)
      .eq("recipient", user.id)
      .is("read_at", null)
      .select("id");
    if (error || !data?.length) {
      receiptError = true;
      console.error("[field notification detail receipt]", error?.message ?? "no row updated", error?.code ?? "RLS_OR_RACE");
    }
  }

  const entries = notificationPayloadEntries(notification.payload);
  const title = tr("field.notification.title", "Notification details", "تفاصيل الإشعار");
  return (
    <Shell current="/field" title={title}>
      <div className="ax-field-page" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <Link className="ax-link ax-inline-target" href="/field" prefetch={false}>
          {tr("field.notification.back", "Back to field dashboard", "العودة إلى لوحة الميدان")}
        </Link>

        {receiptError && (
          <div className="ax-banner ax-banner--warning" role="alert">
            {tr("field.notification.receiptError", "The notification opened, but its read receipt could not be saved. Try again.", "فُتح الإشعار، لكن تعذر حفظ إيصال القراءة. حاول مرة أخرى.")}
          </div>
        )}

        <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }} aria-label={title}>
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(8rem, auto) 1fr", gap: "var(--ax-space-150) var(--ax-space-300)" }}>
            <dt style={{ font: "var(--ax-text-body-strong)" }}>{tr("field.notification.eventKey", "Event key", "مفتاح الحدث")}</dt>
            <dd className="ax-numeric" style={{ margin: 0, overflowWrap: "anywhere" }}>{notification.event_key}</dd>
            <dt style={{ font: "var(--ax-text-body-strong)" }}>{tr("field.notification.createdAt", "Created at", "تاريخ الإنشاء")}</dt>
            <dd className="ax-numeric" style={{ margin: 0 }}>{formatDateTime(notification.created_at, locale === "ar" ? "ar" : "en")}</dd>
          </dl>
        </section>

        <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
          <h3 style={{ marginBlockStart: 0 }}>{tr("field.notification.payload", "Payload", "بيانات الإشعار")}</h3>
          {entries.length === 0 ? (
            <p className="ax-caption" role="status">
              {tr("field.notification.payloadEmpty", "No notification payload is available.", "لا تتوفر بيانات إضافية للإشعار.")}
            </p>
          ) : (
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(8rem, auto) 1fr", gap: "var(--ax-space-150) var(--ax-space-300)" }}>
              {entries.map(entry => (
                <div key={entry.key} style={{ display: "contents" }}>
                  <dt className="ax-numeric" style={{ font: "var(--ax-text-body-strong)", overflowWrap: "anywhere" }}>{entry.key}</dt>
                  <dd className="ax-numeric" style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </Shell>
  );
}
