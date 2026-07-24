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
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";
import { formatDateTime } from "@/lib/dates";
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
  events: Record<string, string>;          // event_key → label
  channels: Record<string, string>;        // channel → label
  notConfigured: string;    // delivery adapter pending (honest state)
};

type Row = {
  id: string; event_key: string; payload: Record<string, unknown> | null;
  channel: string; delivery_state: string; read_at: string | null; created_at: string;
};

const POLL_MS = 30_000;
const isUnread = (r: Row) => isNotificationUnread(r);

// K-008 — session-scoped result cache. The shell remounts on every client
// navigation (K-001), which used to re-fire the list query + exact count on
// each mount. A fresh-enough cached snapshot serves remounts; the 30 s poll
// and opening the dropdown still hit the database. Marking rows read updates
// the cache in place so the badge never goes stale between polls.
let snapshot: { at: number; rows: Row[]; unreadTotal: number; userId: string; visitNames: Record<string, string> } | null = null;
const SNAPSHOT_TTL_MS = POLL_MS;

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

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
    if (!force && snapshot && snapshot.userId === user.id && Date.now() - snapshot.at < SNAPSHOT_TTL_MS) {
      setErr("");
      setRows(snapshot.rows);
      setUnreadTotal(snapshot.unreadTotal);
      setVisitNames(snapshot.visitNames);
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
    snapshot = { at: Date.now(), rows, unreadTotal, userId: user.id, visitNames };
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
    if (snapshot) {
      snapshot.rows = snapshot.rows.map(x => x.id === r.id ? { ...x, ...patch } as Row : x);
      snapshot.unreadTotal = Math.max(0, snapshot.unreadTotal - 1);
    }
    setRows(rs => rs.map(x => x.id === r.id ? { ...x, ...patch } as Row : x));
    setUnreadTotal(n => Math.max(0, n - 1));
  }

  async function markAllRead() {
    for (const r of rows.filter(isUnread)) await markRead(r);
  }

  if (!authed) return null;
  const unread = Math.max(unreadTotal, rows.filter(isUnread).length);
  const detail = (p: Record<string, unknown> | null) => {
    const visitId = typeof p?.visit_id === "string" ? p.visit_id : null;
    if (visitId && visitNames[visitId]) return visitNames[visitId];
    const cand = [p?.reason, p?.decision, p?.factory, p?.inspection_id, p?.session_id]
      .find(x => typeof x === "string" && x);
    return (cand as string | undefined) ?? "";
  };
  return (
    <div ref={wrapRef} className="sq-notification">
      <button className="sq-notification__trigger" aria-label={strings.label} aria-expanded={open}
        onClick={() => { setOpen(o => !o); if (!open) void load(true); }}>
        <BellIcon />
        {unread > 0 && <span className="sq-notification__badge" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && popoverPos && typeof document !== "undefined" && createPortal(
        <div ref={popoverRef} className="ax-popover" role="dialog" aria-label={strings.heading}
          style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, right: popoverPos.right, inlineSize: 360, maxInlineSize: "80vw", zIndex: 30, display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <strong>{strings.heading}</strong>
            {unread > 0 && <button className="sq-btn sq-btn--subtle" onClick={markAllRead}>{strings.markAll}</button>}
          </div>
          {err && <p className="sq-caption" role="alert">{err}</p>}
          {rows.length === 0 && <p className="sq-caption">{strings.empty}</p>}
          <div style={{ maxBlockSize: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {rows.map(r => {
              const href = notificationHref(r.event_key, r.payload, fieldOnly);
              return (
              <div key={r.id} className="sq-surface" style={{ padding: "var(--space-3)", borderInlineStart: isUnread(r) ? "3px solid var(--action-primary)" : "3px solid transparent" }}>
                <div className="sq-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontWeight: isUnread(r) ? 700 : 500 }}>
                      {strings.events[r.event_key] ?? r.event_key.replace(/_/g, " ")}
                      {isUnread(r) && <span className="sq-sr-only"> — {strings.unreadBadge}</span>}
                    </strong>
                    {detail(r.payload) && <p className="sq-caption sq-numeric" style={{ margin: 0 }}>{detail(r.payload).slice(0, 80)}</p>}
                    <p className="sq-caption sq-numeric" style={{ margin: 0 }}>
                      {formatDateTime(r.created_at, locale === "ar" ? "ar" : "en")}
                      {" · "}{strings.channels[r.channel] ?? r.channel}
                      {r.delivery_state === "not_configured" && <> · <span className="sq-lozenge sq-lozenge--warning">{strings.notConfigured}</span></>}
                    </p>
                    {href && (
                      <Link className="sq-link" href={href} prefetch={false}
                        onClick={() => { if (isUnread(r)) void markRead(r); }}>
                        {strings.view} →
                      </Link>
                    )}
                  </div>
                  {isUnread(r) && <button className="sq-btn sq-btn--subtle" onClick={() => markRead(r)}>{strings.markRead}</button>}
                </div>
              </div>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
