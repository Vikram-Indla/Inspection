import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { isNotificationUnread, notificationHref } from "@/lib/notification-read";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./notifications.module.css";

// SAQEEL Field Notifications.dc.html — the design's dedicated Notifications
// screen: a back-arrow header (NOT the bottom tab bar — this screen has none in
// the design), an All/Unread filter segment, and icon-coded notification rows
// (category icon, title, unread "New" badge, 2-line detail, timestamp). Same
// recipient-scoped query shape as NotificationBell.tsx, server-rendered here
// with an all/unread filter. Deep-links reuse the exact same notificationHref()
// the bell already uses — no second link-resolution rule. Every value is real,
// RLS-scoped data; nothing is fabricated (project data-integrity law).
type Row = {
  id: string; event_key: string; payload: Record<string, unknown> | null;
  channel: string; delivery_state: string; read_at: string | null; created_at: string;
};

// Category → icon meta, tokens ported verbatim from the design's iconMeta()
// (SAQEEL Field Notifications.dc.html). Only DS tokens — no bare colors.
const ICONS = {
  license: { path: "M9 12h6M9 16h6M9 8h3M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", bg: "var(--accent-soft)", color: "var(--accent-text)" },
  assign: { path: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", bg: "var(--status-compliant-soft)", color: "var(--status-compliant-text)" },
  return: { path: "M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1", bg: "var(--status-warning-soft)", color: "var(--status-warning-text)" },
  sync: { path: "M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0 1 14.1-3.5M19.5 15a8 8 0 0 1-14.1 3.5", bg: "var(--surface-sunken)", color: "var(--text-secondary)" },
  calendar: { path: "M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", bg: "var(--accent-soft)", color: "var(--accent-text)" },
  cancel: { path: "M12 9v4M12 16.5h.01M10.3 4.5 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.5a1.5 1.5 0 0 0-2.6 0z", bg: "var(--status-critical-soft)", color: "var(--status-critical-text)" },
} as const;

// Map the real notification event_key to one of the design's icon categories.
function iconFor(eventKey: string): (typeof ICONS)[keyof typeof ICONS] {
  switch (eventKey) {
    case "assignment": case "visit_republished": return ICONS.assign;
    case "visit_returned": case "review_decision": case "virtual_closed": return ICONS.return;
    case "visit_cancelled": case "visit_expired": return ICONS.cancel;
    case "reschedule": case "visit_rescheduled": case "virtual_scheduled": case "virtual_rescheduled": return ICONS.calendar;
    case "otp_code": return ICONS.license;
    default: return ICONS.sync;
  }
}

export default async function FieldNotificationsList({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const title = tr("field.notifications.title", "Notifications", "الإشعارات");

  // Design header: back arrow returns to the field dashboard (SAQEEL Field
  // Dashboard.dc.html → /field). data-directional flips the glyph in RTL.
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="m15 6-6 6 6 6" /></svg>
    </Link>
  );
  const header = (
    <FieldHeader leading={back} title={title}
      langHref={langHref} langLabel={langLabel} />
  );

  let query = sb.from("notifications")
    .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
    .eq("recipient", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (unreadOnly) query = query.is("read_at", null).not("delivery_state", "in", "(read,handled)");
  const { data, error } = await query;

  if (error) {
    console.error("[field notifications]", error.message);
    return (
      <>
        {header}
        <div style={{ flex: 1, padding: 20 }}>
          <div role="alert" style={{ padding: 16, borderRadius: "var(--radius-md)", background: "var(--status-critical-soft)", color: "var(--status-critical-text)", borderInlineStart: "3px solid var(--status-critical)" }}>
            {tr("field.notifications.unavailable", "Notifications are temporarily unavailable. Try again.", "الإشعارات غير متاحة مؤقتًا. حاول مرة أخرى.")}
          </div>
        </div>
      </>
    );
  }

  const rows = (data ?? []) as Row[];
  const unreadCount = unreadOnly ? rows.length : rows.filter(isNotificationUnread).length;

  // Payloads only carry visit_id (a raw UUID) — resolve it to the actual
  // factory name in one batched follow-up query rather than showing the ID
  // itself as the row's subtitle (an inspector needs the establishment name,
  // not a UUID).
  const visitIds = Array.from(new Set(rows.map(r => typeof r.payload?.visit_id === "string" ? r.payload.visit_id as string : null).filter((v): v is string => !!v)));
  const visitFactoryNames = new Map<string, string>();
  if (visitIds.length) {
    const { data: visitRows } = await sb.from("visits").select("id, factories(name)").in("id", visitIds);
    for (const v of (visitRows ?? []) as unknown as { id: string; factories: { name: string | null } | null }[]) {
      if (v.factories?.name) visitFactoryNames.set(v.id, v.factories.name);
    }
  }

  const detail = (p: Record<string, unknown> | null) => {
    const visitId = typeof p?.visit_id === "string" ? p.visit_id : null;
    if (visitId && visitFactoryNames.has(visitId)) return visitFactoryNames.get(visitId)!;
    const cand = [p?.reason, p?.decision, p?.factory, p?.inspection_id, p?.session_id]
      .find(x => typeof x === "string" && x);
    return (cand as string | undefined) ?? "";
  };

  return (
    <>
      {header}

      {/* All / Unread filter segment (design .fn-seg) */}
      <div className={styles.seg} role="tablist" aria-label={title}>
        <Link role="tab" aria-selected={!unreadOnly} aria-pressed={!unreadOnly ? "true" : "false"}
          href="/field/notifications" prefetch={false}>
          {tr("field.notifications.all", "All", "الكل")}
        </Link>
        <Link role="tab" aria-selected={unreadOnly} aria-pressed={unreadOnly ? "true" : "false"}
          href="/field/notifications?filter=unread" prefetch={false}>
          {tr("field.notifications.unreadFilter", "Unread", "غير مقروءة")} ({unreadCount})
        </Link>
      </div>

      <div className={styles.wrap} style={{ flex: 1 }}>
        {rows.length === 0 ? (
          <div className={styles.empty} role="status">
            {unreadOnly
              ? tr("field.notifications.emptyUnread", "No unread notifications.", "لا توجد إشعارات غير مقروءة.")
              : tr("field.notifications.empty", "No notifications in this view.", "لا توجد إشعارات في هذا القسم.")}
          </div>
        ) : (
          rows.map(row => {
            const href = notificationHref(row.event_key, row.payload, true) ?? `/field/notifications/${row.id}`;
            const unread = isNotificationUnread(row);
            const icon = iconFor(row.event_key);
            const message = detail(row.payload);
            const rowTitle = t(`enum.${row.event_key}`, row.event_key.replace(/_/g, " "));
            return (
              <Link key={row.id} href={href} prefetch={false}
                className={`${styles.row} ${unread ? styles.rowUnread : ""}`}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span className={styles.icn} style={{ background: icon.bg, color: icon.color }} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 19, height: 19 }}><path d={icon.path} /></svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{rowTitle}</span>
                      {unread && <span className="badge" style={{ background: "var(--status-warning-soft)", color: "var(--status-warning-text)", height: 18 }}>{tr("field.notifications.newBadge", "New", "جديد")}</span>}
                    </div>
                    {message && <div className={`t-caption ${styles.clamp2}`}>{message}</div>}
                    <div className="t-caption" style={{ marginBlockStart: 6, color: "var(--text-muted)" }}>{formatDateTime(row.created_at, locale === "ar" ? "ar" : "en")}</div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
