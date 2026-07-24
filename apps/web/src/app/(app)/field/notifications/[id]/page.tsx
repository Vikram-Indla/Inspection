import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { notificationPayloadEntries, notificationReadPatch } from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// PLAN v7 item 2 · MVP1-M03-001 · AC-0099
// Notification payloads are event-specific JSON. This route deliberately
// renders stored keys generically instead of imposing an invented schema.
// SAQEEL Field Notifications.dc.html — DS chrome (back-arrow header + DS cards);
// the read-receipt write and generic payload rendering are unchanged.
export default async function FieldNotificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const title = tr("field.notification.title", "Notification details", "تفاصيل الإشعار");
  const back = (
    <Link href="/field/notifications" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="m15 6-6 6 6 6" /></svg>
    </Link>
  );
  const header = (
    <FieldHeader leading={back} title={title}
      langHref={langHref} langLabel={langLabel} />
  );

  const { data: notification, error: readError } = await sb
    .from("notifications")
    .select("id, event_key, payload, delivery_state, read_at, created_at")
    .eq("id", id)
    .eq("recipient", user.id)
    .maybeSingle();

  if (readError) {
    console.error("[field notification detail read]", readError.message, readError.code);
    return (
      <>
        {header}
        <div style={{ flex: 1, padding: 20 }}>
          <div className="alert alert-critical" role="alert">
            {tr("field.notification.unavailable", "This notification is temporarily unavailable. Try again.", "هذا الإشعار غير متاح مؤقتًا. حاول مرة أخرى.")}
          </div>
        </div>
      </>
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
  const kv = { display: "grid", gridTemplateColumns: "minmax(8rem, auto) 1fr", gap: "10px 18px", margin: 0 } as const;
  return (
    <>
      {header}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {receiptError && (
          <div className="alert alert-warning" role="alert">
            {tr("field.notification.receiptError", "The notification opened, but its read receipt could not be saved. Try again.", "فُتح الإشعار، لكن تعذر حفظ إيصال القراءة. حاول مرة أخرى.")}
          </div>
        )}

        <section className="card" style={{ padding: 18 }} aria-label={title}>
          <dl style={kv}>
            <dt style={{ fontWeight: 600, fontSize: 13 }}>{tr("field.notification.eventKey", "Event key", "مفتاح الحدث")}</dt>
            <dd className="id-code" style={{ margin: 0, overflowWrap: "anywhere" }}>{notification.event_key}</dd>
            <dt style={{ fontWeight: 600, fontSize: 13 }}>{tr("field.notification.createdAt", "Created at", "تاريخ الإنشاء")}</dt>
            <dd style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>{formatDateTime(notification.created_at, locale === "ar" ? "ar" : "en")}</dd>
          </dl>
        </section>

        <section className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>{tr("field.notification.payload", "Payload", "بيانات الإشعار")}</h3>
          {entries.length === 0 ? (
            <p className="t-caption" role="status">
              {tr("field.notification.payloadEmpty", "No notification payload is available.", "لا تتوفر بيانات إضافية للإشعار.")}
            </p>
          ) : (
            <dl style={kv}>
              {entries.map(entry => (
                <div key={entry.key} style={{ display: "contents" }}>
                  <dt className="id-code" style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{entry.key}</dt>
                  <dd style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </>
  );
}
