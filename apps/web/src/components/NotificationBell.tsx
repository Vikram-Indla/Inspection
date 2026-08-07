"use client";
// Platform-wide notification bell (ENG-11 · M03-001 companion) — every persona
// sees their own RLS-scoped rows (notif_own, 0002). Polls unread count, lists
// the latest rows, records read receipts (read_at; notif_update_recipient 0015).
// SB19 — strings built server-side with t() and passed as props.
// M10 / PLN-REQ-009 — planning event rows deep-link into the app: returned
// visits land on the visit detail focused on the return block (?focus=return);
// cancelled/expired/republished/rescheduled/assignment rows land on the visit
// detail. Opening a row also records its read receipt.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/saqeel/icon/icon";
import PingDot from "@/components/saqeel/ping-dot/ping-dot";
import styles from "./NotificationBell.module.css";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";
import { formatDate, riyadhDayDiff } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { isNotificationUnread, notificationHref, notificationReadPatch } from "@/lib/notification-read";

export type BellStrings = {
  label: string;            // accessible name for the toggle
  heading: string;
  empty: string;
  markAll: string;
  markRead: string;
  unreadBadge: string;      // sr-only tag on unread rows
  loadError: string;
  view: string;             // deep-link into the subject view (M10 / PLN-REQ-009)
  viewAll: string;          // footer row — link to the full notifications list
  today: string;
  yesterday: string;
  hoursAgo: string;         // "{n} hour{s} ago" template
  minutesAgo: string;       // "{n} minute{s} ago" template
  justNow: string;
  events: Record<string, string>;          // event_key → label
  channels: Record<string, string>;        // channel → label
  notConfigured: string;    // delivery adapter pending (honest state)
  contextLabels: { factory: string; reason: string; decision: string };
};

type Row = {
  id: string; event_key: string; payload: Record<string, unknown> | null;
  channel: string; delivery_state: string; read_at: string | null; created_at: string;
};

const POLL_MS = 30_000;
const MAX_ROWS = 8;
const isUnread = (r: Row) => isNotificationUnread(r);

// "2 hours ago" / "Yesterday" / the date beyond that — never a raw timestamp.
function relativeLabel(createdAt: string, strings: BellStrings, locale: Locale, now: Date): string {
  const diffMin = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000);
  if (diffMin < 1) return strings.justNow;
  if (diffMin < 60) return strings.minutesAgo.replace("{n}", String(diffMin)).replace("{s}", diffMin === 1 ? "" : "s");
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return strings.hoursAgo.replace("{n}", String(diffHr)).replace("{s}", diffHr === 1 ? "" : "s");
  const dayDiff = riyadhDayDiff(createdAt, now);
  if (dayDiff === 1) return strings.yesterday;
  return formatDate(createdAt, locale === "ar" ? "ar" : "en");
}

// Day-group heading: Today / Yesterday / the date.
function dayHeading(createdAt: string, strings: BellStrings, locale: Locale, now: Date): string {
  const dayDiff = riyadhDayDiff(createdAt, now);
  if (dayDiff === 0) return strings.today;
  if (dayDiff === 1) return strings.yesterday;
  return formatDate(createdAt, locale === "ar" ? "ar" : "en");
}

// K-008 — session-scoped result cache. The shell remounts on every client
// navigation (K-001), which used to re-fire the list query + exact count on
// each mount. A fresh-enough cached snapshot serves remounts; the 30 s poll
// and opening the dropdown still hit the database. Marking rows read updates
// the cache in place so the badge never goes stale between polls.
type Snapshot = { at: number; rows: Row[]; unreadTotal: number; userId: string; visitNames: Record<string, string> };

const cache: { current: Snapshot | null } = { current: null };
const SNAPSHOT_TTL_MS = POLL_MS;


export default function NotificationBell({ strings, locale, fieldOnly = false }: { strings: BellStrings; locale: Locale; fieldOnly?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [visitNames, setVisitNames] = useState<Record<string, string>>({});
  const [popoverPos, setPopoverPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [authed, setAuthed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const sbRef = useRef(supabaseBrowser());

  const load = useCallback(async (force = false) => {
    const sb = sbRef.current;
    const { data: { user } } = await getVerifiedUser(sb);
    if (!user) { setAuthed(false); return; }
    setAuthed(true);
    const cached = cache.current;
    if (!force && cached && cached.userId === user.id && Date.now() - cached.at < SNAPSHOT_TTL_MS) {
      setErr("");
      setRows(cached.rows);
      setUnreadTotal(cached.unreadTotal);
      setVisitNames(cached.visitNames);
      return;
    }
    const [{ data, error }, { count }] = await Promise.all([
      sb.from("notifications")
        .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
        .eq("recipient", user.id)
        .order("created_at", { ascending: false })
        .limit(15),
      sb.from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient", user.id)
        .is("read_at", null)
        .not("delivery_state", "in", "(read,handled)"),
    ]);
    if (error) { setErr(strings.loadError); return; }
    setErr("");
    const rows = (data ?? []) as Row[];
    const unreadTotal = count ?? 0;
    // Payloads only carry visit_id (a raw UUID) — resolve to the real factory
    // name in one batched follow-up query rather than showing the ID itself
    // (same fix as the dedicated /field/notifications list page).
    const visitIds = Array.from(new Set(rows.map(r => typeof r.payload?.visit_id === "string" ? r.payload.visit_id as string : null).filter((v): v is string => !!v)));
    const visitNames: Record<string, string> = {};
    if (visitIds.length) {
      const { data: visitRows } = await sb.from("visits").select("id, factories(name)").in("id", visitIds);
      for (const v of (visitRows ?? []) as unknown as { id: string; factories: { name: string | null } | null }[]) {
        if (v.factories?.name) visitNames[v.id] = v.factories.name;
      }
    }
    cache.current = { at: Date.now(), rows, unreadTotal, userId: user.id, visitNames };
    setRows(rows);
    setUnreadTotal(unreadTotal);
    setVisitNames(visitNames);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Popover portals to document.body (see render below) so it never sits
  // inside the sticky pagehead's compositing subtree — that reliably failed
  // to paint the popover above later sibling content in that header
  // (same root cause as the global search dropdown fix, DR-36/DR-51),
  // regardless of z-index. Position is measured off the trigger and kept in
  // sync while open.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rtl = getComputedStyle(document.documentElement).direction === "rtl";
      setPopoverPos(rtl
        ? { top: rect.bottom + 6, left: rect.left }
        : { top: rect.bottom + 6, right: window.innerWidth - rect.right });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Light dismiss on outside click. The popover is portaled to document.body
  // (see render below), so it's no longer a DOM descendant of wrapRef — a
  // click inside the portaled popover itself must also count as "inside",
  // or every click there (e.g. "Mark read") closes the menu before it runs.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function markRead(r: Row) {
    const sb = sbRef.current;
    // read_at is the platform read receipt; legacy 'queued' rows also flip
    // delivery_state so legacy delivery-state consumers remain compatible.
    const patch = notificationReadPatch(r.delivery_state, new Date().toISOString());
    const { error } = await sb.from("notifications").update(patch).eq("id", r.id);
    if (error) { setErr(strings.loadError); return; }
    const cached = cache.current;
    if (cached) {
      cache.current = {
        ...cached,
        rows: cached.rows.map(x => x.id === r.id ? { ...x, ...patch } as Row : x),
        unreadTotal: Math.max(0, cached.unreadTotal - 1),
      };
    }
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, ...patch } as Row : x));
    setUnreadTotal(n => Math.max(0, n - 1));
  }

  async function markAllRead() {
    for (const r of rows.filter(isUnread)) await markRead(r);
  }

  if (!authed) return null;
  const unread = Math.max(unreadTotal, rows.filter(isUnread).length);
  // Only a resolved factory/visit name or a semantic string is shown — never
  // a raw fixture ID (inspection_id/session_id are UUIDs, not context). Every
  // value is paired with which field it is (factory/reason/decision) so it
  // reads as labelled business data, not an orphaned string.
  const detail = (p: Record<string, unknown> | null): { label: string; value: string } | null => {
    const visitId = typeof p?.visit_id === "string" ? p.visit_id : null;
    if (visitId && visitNames[visitId]) return { label: strings.contextLabels.factory, value: visitNames[visitId] };
    if (typeof p?.factory === "string" && p.factory) return { label: strings.contextLabels.factory, value: p.factory };
    if (typeof p?.reason === "string" && p.reason) return { label: strings.contextLabels.reason, value: p.reason };
    if (typeof p?.decision === "string" && p.decision) return { label: strings.contextLabels.decision, value: p.decision };
    return null;
  };
  return (
    <div ref={wrapRef} className={styles.root}>
      <button className={styles.trigger} aria-label={strings.label} aria-expanded={open}
        onClick={() => { setOpen(o => !o); if (!open) void load(true); }}>
        <Icon name="notify" size="lg" />
        {unread > 0 && <span className={styles.badge} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && popoverPos && typeof document !== "undefined" && createPortal(
        <div ref={popoverRef} className={styles.panel} role="dialog" aria-label={strings.heading}
          style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, right: popoverPos.right, zIndex: 30 }}>
          <div className={styles.header}>
            <span className={styles.headingGroup}>
              <span className={styles.heading}>{strings.heading}</span>
              {unread > 0 && <span className={styles.count}>{unread > 99 ? "99+" : unread}</span>}
            </span>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={markAllRead}>{strings.markAll}</button>
            )}
          </div>
          {err && <p className={styles.state} data-error="" role="alert">{err}</p>}
          {!err && rows.length === 0 && <p className={styles.state}>{strings.empty}</p>}
          {rows.length > 0 && (
            <div className={styles.list}>
              {(() => {
                const now = new Date();
                const shown = rows.slice(0, MAX_ROWS);
                const headings = shown.map(r => dayHeading(r.created_at, strings, locale, now));
                return shown.map((r, i) => {
                  const showHeading = headings[i] !== headings[i - 1];
                  const href = notificationHref(r.event_key, r.payload, fieldOnly);
                  const unreadRow = isUnread(r);
                  const context = detail(r.payload);
                  const body = (
                    <>
                      <span className={styles.marker}>
                        {unreadRow ? <PingDot tone="accent" /> : null}
                      </span>
                      <span className={styles.body}>
                        <span className={styles.title}>
                          {strings.events[r.event_key] ?? r.event_key.replace(/_/g, " ")}
                          {unreadRow && <span className="sqx-visually-hidden"> — {strings.unreadBadge}</span>}
                        </span>
                        {context && (
                          <span className={styles.context}>
                            <span className={styles.contextLabel}>{context.label}</span>{" "}{context.value.slice(0, 80)}
                          </span>
                        )}
                        <span className={styles.meta}>
                          <span>{relativeLabel(r.created_at, strings, locale, now)}</span>
                          {r.channel !== "inapp" && <span>{strings.channels[r.channel] ?? r.channel}</span>}
                          {r.delivery_state === "not_configured" && (
                            <span className={styles.pending}>{strings.notConfigured}</span>
                          )}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <div key={r.id}>
                      {showHeading && <div className={styles.dayHeading}>{headings[i]}</div>}
                      {href ? (
                        <Link className={styles.item} data-interactive="" data-read={unreadRow ? undefined : ""}
                          href={href} prefetch={false}
                          onClick={() => { if (unreadRow) void markRead(r); }}>
                          {body}
                        </Link>
                      ) : (
                        <div className={styles.item} data-read={unreadRow ? undefined : ""}>{body}</div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
          {fieldOnly && (
            <div className={styles.footer}>
              <Link className={styles.viewAll} href="/field/notifications" prefetch={false}>
                {strings.viewAll}
              </Link>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
