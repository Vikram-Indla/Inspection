import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import { isNotificationUnread, notificationHref } from "@/lib/notification-read";
import { formatDateTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// SAQEEL Field Notifications.dc.html — dedicated list route (previously only
// the bell dropdown + notification detail existed). Same recipient-scoped
// query shape as NotificationBell.tsx, server-rendered here instead of
// client-polled, with an all/unread filter. Deep-links reuse the exact same
// notificationHref() the bell already uses — no second link-resolution rule.
type Row = {
  id: string; event_key: string; payload: Record<string, unknown> | null;
  channel: string; delivery_state: string; read_at: string | null; created_at: string;
};

export default async function FieldNotificationsList({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const tabs = (
    <FieldTabs active="notifications" labels={{
      home: t("field.tabs.dashboard", "Dashboard"),
      myTasks: t("field.tabs.visits", "Visits"),
      establishments: t("field.establishments.title", "Field establishments"),
      notifications: t("field.notifications.title", "Notifications"),
      account: t("field.account.title", "Account"),
    }} />
  );

  let query = sb.from("notifications")
    .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
    .eq("recipient", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (unreadOnly) query = query.is("read_at", null).not("delivery_state", "in", "(read,handled)");
  const { data, error } = await query;

  const title = tr("field.notifications.title", "Notifications", "الإشعارات");
  if (error) {
    return (
      <Shell current="/field" title={title}>
        <div className="ax-banner ax-banner--critical" role="alert">
          {tr("field.notifications.unavailable", "Notifications are temporarily unavailable. Try again.", "الإشعارات غير متاحة مؤقتًا. حاول مرة أخرى.")}
        </div>
        {tabs}
      </Shell>
    );
  }

  const rows = (data ?? []) as Row[];

  // Payloads only carry visit_id (a raw UUID) — resolve it to the actual
  // factory name in one batched follow-up query rather than showing the ID
  // itself as the row's subtitle (caught in live design review: an inspector
  // has no use for a UUID, they need to know which establishment it's about).
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
    <Shell current="/field" title={title}
      context={<span className="ax-lozenge ax-lozenge--info">{rows.length} {unreadOnly ? tr("field.notifications.unread", "unread", "غير مقروء") : tr("field.notifications.total", "total", "الإجمالي")}</span>}>
      <div className="ax-field-page" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <div className="ax-tabs" role="tablist" aria-label={title}>
          <Link className="ax-link" role="tab" aria-selected={!unreadOnly} href="/field/notifications" prefetch={false}>
            {tr("field.notifications.all", "All", "الكل")}
          </Link>
          <Link className="ax-link" role="tab" aria-selected={unreadOnly} href="/field/notifications?filter=unread" prefetch={false}>
            {tr("field.notifications.unreadFilter", "Unread", "غير مقروء")}
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="ax-caption" role="status">
            {unreadOnly
              ? tr("field.notifications.emptyUnread", "No unread notifications.", "لا توجد إشعارات غير مقروءة.")
              : tr("field.notifications.empty", "No notifications yet.", "لا توجد إشعارات بعد.")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            {rows.map(row => {
              const href = notificationHref(row.event_key, row.payload, true) ?? `/field/notifications/${row.id}`;
              const unread = isNotificationUnread(row);
              return (
                <Link key={row.id} href={href} prefetch={false}
                  className="ax-surface ax-panel"
                  style={{ display: "block", padding: "var(--ax-space-200)", borderInlineStart: unread ? "3px solid var(--ax-color-primary)" : "3px solid transparent", textDecoration: "none", color: "inherit", textAlign: "start" }}>
                  <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontWeight: unread ? 700 : 500 }}>
                        {row.event_key.replace(/_/g, " ")}
                        {unread && <span className="ax-sr-only"> — {tr("field.notifications.unreadBadge", "unread", "غير مقروء")}</span>}
                      </strong>
                      {detail(row.payload) && <p className="ax-caption ax-numeric" style={{ margin: 0 }}>{detail(row.payload).slice(0, 100)}</p>}
                      <p className="ax-caption ax-numeric" style={{ margin: 0 }}>{formatDateTime(row.created_at, locale === "ar" ? "ar" : "en")}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {tabs}
    </Shell>
  );
}
