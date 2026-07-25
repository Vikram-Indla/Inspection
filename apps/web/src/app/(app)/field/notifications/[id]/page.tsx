import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { notificationHref, notificationPayloadEntries, notificationReadPatch } from "@/lib/notification-read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { notificationCategory, notificationCategoryLabel, notificationIcon } from "../notification-meta";
import styles from "../notifications.module.css";

// PLAN v7 item 2 · MVP1-M03-001 · AC-0099
// Notification payloads are event-specific JSON. This route deliberately
// renders stored keys generically instead of imposing an invented schema.
//
// SAQEEL PWA-Field Notifications.dc.html, isDetail branch — hero (46px icon
// tile, title, date line), a .panel message block, and a dl.desc of Category /
// Sender / Notification ID. The design's mock carries a written message body, a
// named human sender and a category on every row; MIM's notifications table has
// no message, sender or category column, so each of those renders only when the
// stored row actually supports it and is omitted otherwise — never a fabricated
// value (CLAUDE.md zero-assumption law). The read-receipt write and the generic
// payload rendering are unchanged.
export default async function FieldNotificationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const title = tr("field.notification.title", "Notification detail", "تفاصيل الإشعار");
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

  // Read-receipt semantics unchanged (AC-0099): same patch, same guard, same
  // single-row conditional update on an unread row owned by this recipient.
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

  const payload = notification.payload as Record<string, unknown> | null;
  const entries = notificationPayloadEntries(notification.payload);
  const icon = notificationIcon(notification.event_key);
  const heading = t(`enum.${notification.event_key}`, notification.event_key.replace(/_/g, " "));
  const dateLine = formatDateTime(notification.created_at, locale === "ar" ? "ar" : "en");

  // Category renders only where one of the design's six categories is actually
  // true of this event; otherwise the row is omitted.
  const category = notificationCategory(notification.event_key);

  // The design's message body has no column here. The nearest real value is the
  // payload's own human-readable reason/decision — rendered only when present.
  const messageCandidate = [payload?.reason, payload?.decision, payload?.message]
    .find(v => typeof v === "string" && v.trim().length > 0);
  const message = typeof messageCandidate === "string" ? messageCandidate : null;

  // There is no sender column. A raw actor UUID is not a sender name, so this
  // row appears only if the payload carries a human-readable one.
  const senderCandidate = [payload?.actor_name, payload?.sender_name, payload?.sender]
    .find(v => typeof v === "string" && v.trim().length > 0);
  const sender = typeof senderCandidate === "string" ? senderCandidate : null;

  const deepLink = notificationHref(notification.event_key, payload, true);

  return (
    <>
      {header}
      <div className={styles.detailWrap}>
        {receiptError && (
          <div className="alert alert-warning" role="alert">
            {tr("field.notification.receiptError", "The notification opened, but its read receipt could not be saved. Try again.", "فُتح الإشعار، لكن تعذر حفظ إيصال القراءة. حاول مرة أخرى.")}
          </div>
        )}

        {/* Hero — design: 46px icon tile, 700/16px title, caption date line. */}
        <div className={styles.hero}>
          <span className={`${styles.icn} ${styles.heroIcn}`} style={{ background: icon.bg, color: icon.color }} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 22, height: 22 }}><path d={icon.path} /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className={styles.heroTitle}>{heading}</h1>
            <div className="t-caption">{dateLine}</div>
          </div>
        </div>

        {message && <div className={`panel ${styles.message}`}>{message}</div>}

        <dl className={styles.desc}>
          {category && (
            <>
              <dt>{tr("field.notification.category", "Category", "الفئة")}</dt>
              <dd>{notificationCategoryLabel(category, locale)}</dd>
            </>
          )}
          {sender && (
            <>
              <dt>{tr("field.notification.sender", "Sender", "المرسل")}</dt>
              <dd><bdi>{sender}</bdi></dd>
            </>
          )}
          <dt>{tr("field.notification.eventKey", "Event key", "مفتاح الحدث")}</dt>
          <dd><span className="id-code">{notification.event_key}</span></dd>
          <dt>{tr("field.notification.notifId", "Notification ID", "معرّف الإشعار")}</dt>
          <dd><span className="id-code">{notification.id}</span></dd>
        </dl>

        {/* Payload — no design counterpart. Retained from the accepted AC-0099
            behaviour: the stored keys are the only complete, true record of
            what this notification carries. */}
        <section className={`panel ${styles.payload}`}>
          <h2 className={styles.payloadTitle}>{tr("field.notification.payload", "Payload", "بيانات الإشعار")}</h2>
          {entries.length === 0 ? (
            <p className="t-caption" style={{ margin: 0 }} role="status">
              {tr("field.notification.payloadEmpty", "No notification payload is available.", "لا تتوفر بيانات إضافية للإشعار.")}
            </p>
          ) : (
            <dl className={styles.desc}>
              {entries.map(entry => (
                <div key={entry.key} style={{ display: "contents" }}>
                  <dt className="id-code" style={{ overflowWrap: "anywhere" }}>{entry.key}</dt>
                  <dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* The design's optional primary action. Resolved by the same
            notificationHref() the list and the bell use — no second rule. */}
        {deepLink && (
          <Link href={deepLink} prefetch={false} className="btn btn-primary btn-block">
            {tr("field.notification.openVisit", "Open visit", "فتح الزيارة")}
          </Link>
        )}
      </div>
    </>
  );
}
