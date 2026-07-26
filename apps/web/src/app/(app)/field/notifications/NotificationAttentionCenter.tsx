"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/dates";
import {
  assignmentNoticeKind,
  fieldNotificationCacheKey,
  parseFieldNotificationCache,
  type AssignmentNoticeKind,
  type FieldNotificationRow,
} from "@/lib/field-notifications";
import { isNotificationUnread, notificationReadPatch } from "@/lib/notification-read";
import { supabaseBrowser } from "@/lib/supabase";
import { NOTIFICATION_ICONS, notificationIcon } from "./notification-meta";
import styles from "./notifications.module.css";

// TASK-IPAD-NOTIFICATIONS-ASSIGNMENT-CHANGES-001
//
// SAQEEL PWA-Field Notifications.dc.html, isList branch. The design renders
// three sections and nothing else: the two-chip filter segment, the row list
// (icon tile · title + New badge · message · date line), and the empty state.
// This component renders those three, in that order.
//
// The design's row is a <button onClick> because its mock has no router. Here
// the row is a real <a href> stretched over the row: the same whole-row
// affordance, but middle-click, open-in-new-tab and assistive navigation work.
//
// The only control the design does not define is the read acknowledgement,
// which is governed behaviour (recipient-scoped, first-receipt-only, offline
// honest) and therefore kept — inside the design's badge slot, not in an extra
// action band. The design's mock marks read in local state on open; here the
// detail route records the receipt server-side on open, so both paths remain.

type Strings = {
  all: string; unread: string; newBadge: string; empty: string;
  offlineCached: string; offlineEmpty: string; refreshFailed: string;
  reconnecting: string; markRead: string; acknowledgementOffline: string;
  acknowledgementFailed: string;
  kinds: Record<AssignmentNoticeKind, string>;
};

type Props = {
  userId: string;
  initialRows: FieldNotificationRow[];
  initialVisitNames: Record<string, string>;
  locale: "en" | "ar";
  initialFilter: "all" | "unread";
  strings: Strings;
};

// One glyph vocabulary for the list and the detail (the design has a single
// iconMeta()). `released` is the one kind the event key alone cannot express,
// because it lives in the assignment payload rather than in event_key.
function iconFor(row: FieldNotificationRow, kind: AssignmentNoticeKind) {
  if (kind === "released") return NOTIFICATION_ICONS.return;
  return notificationIcon(row.event_key);
}

async function loadLive(userId: string) {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("notifications")
    .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
    .eq("recipient", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as FieldNotificationRow[];
  const visitIds = Array.from(new Set(rows
    .map(row => typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null)
    .filter((id): id is string => !!id)));
  const visitNames: Record<string, string> = {};
  if (visitIds.length) {
    const { data: visits, error: visitError } = await sb.from("visits")
      .select("id, factories(name)")
      .in("id", visitIds);
    if (visitError) throw visitError;
    for (const visit of (visits ?? []) as unknown as { id: string; factories: { name: string | null } | null }[]) {
      if (visit.factories?.name) visitNames[visit.id] = visit.factories.name;
    }
  }
  return { rows, visitNames };
}

export default function NotificationAttentionCenter(props: Props) {
  const [rows, setRows] = useState(props.initialRows);
  const [visitNames, setVisitNames] = useState(props.initialVisitNames);
  const [online, setOnline] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const storageKey = fieldNotificationCacheKey(props.userId);

  const saveCache = useCallback((nextRows: FieldNotificationRow[], nextNames: Record<string, string>) => {
    const nextCachedAt = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        userId: props.userId, cachedAt: nextCachedAt, rows: nextRows, visitNames: nextNames,
      }));
      setCachedAt(nextCachedAt);
    } catch {
      // Cache availability is best-effort; live RLS-scoped data remains usable.
    }
  }, [props.userId, storageKey]);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const live = await loadLive(props.userId);
      setRows(live.rows);
      setVisitNames(live.visitNames);
      saveCache(live.rows, live.visitNames);
      setMessage("");
    } catch {
      setMessage(props.strings.refreshFailed);
    }
  }, [props.userId, props.strings.refreshFailed, saveCache]);

  useEffect(() => {
    const isOnline = navigator.onLine;
    setOnline(isOnline);
    const cached = parseFieldNotificationCache(localStorage.getItem(storageKey), props.userId);
    if (!isOnline && cached) {
      setRows(cached.rows);
      setVisitNames(cached.visitNames);
      setCachedAt(cached.cachedAt);
    } else if (isOnline) {
      saveCache(props.initialRows, props.initialVisitNames);
    }
    const onOffline = () => {
      setOnline(false);
      const snapshot = parseFieldNotificationCache(localStorage.getItem(storageKey), props.userId);
      if (snapshot) {
        setRows(snapshot.rows);
        setVisitNames(snapshot.visitNames);
        setCachedAt(snapshot.cachedAt);
      }
    };
    const onOnline = () => {
      setOnline(true);
      setMessage(props.strings.reconnecting);
      void refresh();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [props.initialRows, props.initialVisitNames, props.strings.reconnecting, props.userId, refresh, saveCache, storageKey]);

  async function acknowledge(row: FieldNotificationRow) {
    if (!online) {
      setMessage(props.strings.acknowledgementOffline);
      return;
    }
    const patch = notificationReadPatch(row.delivery_state, new Date().toISOString());
    const { data, error } = await supabaseBrowser().from("notifications")
      .update(patch)
      .eq("id", row.id)
      .eq("recipient", props.userId)
      .is("read_at", null)
      .select("id");
    if (error || !data?.length) {
      setMessage(props.strings.acknowledgementFailed);
      return;
    }
    const nextRows = rows.map(item => item.id === row.id ? { ...item, ...patch } as FieldNotificationRow : item);
    setRows(nextRows);
    saveCache(nextRows, visitNames);
    setMessage("");
  }

  const visibleRows = useMemo(
    () => props.initialFilter === "unread" ? rows.filter(isNotificationUnread) : rows,
    [props.initialFilter, rows],
  );
  const unreadCount = rows.filter(isNotificationUnread).length;

  // The design has no permanent connectivity band. The stale-snapshot notice is
  // contract behaviour (never present cached data as live), so it appears only
  // when the snapshot really is stale.
  const offlineNotice = online
    ? null
    : cachedAt
      ? props.strings.offlineCached.replace("{time}", formatDateTime(cachedAt, props.locale))
      : props.strings.offlineEmpty;

  return (
    <>
      {/* 2 — design .fn-seg: exactly two chips, All and Unread (n). */}
      <div className={styles.seg}>
        <Link href="/field/notifications" prefetch={false}
          aria-current={props.initialFilter === "all" ? "page" : undefined}>
          {props.strings.all}
        </Link>
        <Link href="/field/notifications?filter=unread" prefetch={false}
          aria-current={props.initialFilter === "unread" ? "page" : undefined}>
          {props.strings.unread} ({unreadCount})
        </Link>
      </div>

      {/* 3 — design .fn-wrap */}
      <div className={styles.wrap} style={{ flex: 1 }}>
        {offlineNotice && (
          <div className={styles.notice}>
            <div className="alert alert-warning" role="status">{offlineNotice}</div>
          </div>
        )}
        {message && (
          <div className={styles.notice}>
            <div className="alert alert-warning" role="alert">{message}</div>
          </div>
        )}

        {visibleRows.length === 0 ? (
          /* 4 — design empty state. One string, as the design writes it: it
             already reads "in this view", so it covers both filters. */
          <div className={styles.empty} role="status">{props.strings.empty}</div>
        ) : visibleRows.map(row => {
          const kind = assignmentNoticeKind(row);
          const icon = iconFor(row, kind);
          const visitId = typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null;
          // The design's message line has no column here. The nearest true
          // value is the visit's factory or the stored reason/decision; when
          // none exists the line is omitted rather than filled in.
          const detail = visitId && visitNames[visitId]
            ? visitNames[visitId]
            : [row.payload?.reason, row.payload?.decision, row.payload?.factory]
                .find(value => typeof value === "string" && value) as string | undefined;
          const unread = isNotificationUnread(row);
          const detailHref = `/field/notifications/${encodeURIComponent(row.id)}`;
          return (
            <article key={row.id} className={`${styles.row} ${unread ? styles.rowUnread : ""}`}>
              <div className={styles.rowInner}>
                <span className={styles.icn} style={{ background: icon.bg, color: icon.color }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d={icon.path} />
                  </svg>
                </span>
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>
                    <Link className={styles.titleLink} href={detailHref} prefetch={false}>
                      {props.strings.kinds[kind]}
                    </Link>
                    {unread && <span className={`badge badge-warning ${styles.newBadge}`}>{props.strings.newBadge}</span>}
                    {unread && (
                      <button className={`btn btn-ghost btn-sm ${styles.markRead}`} type="button"
                        onClick={() => void acknowledge(row)}>
                        {props.strings.markRead}
                      </button>
                    )}
                  </div>
                  {detail && <div className={`t-caption ${styles.clamp2}`}>{detail}</div>}
                  <div className={`t-caption ${styles.dateLine}`}>{formatDateTime(row.created_at, props.locale)}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
