"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/dates";
import {
  assignmentNoticeKind,
  fieldNotificationCacheKey,
  parseFieldNotificationCache,
  type FieldNotificationRow,
} from "@/lib/field-notifications";
import { isNotificationUnread, notificationReadPatch } from "@/lib/notification-read";
import { supabaseBrowser } from "@/lib/supabase";
import styles from "./notifications.module.css";

type Strings = {
  all: string; unread: string; newBadge: string; empty: string; emptyUnread: string;
  offlineCached: string; offlineEmpty: string; live: string; refreshFailed: string;
  reconnecting: string; markRead: string; acknowledgementOffline: string;
  acknowledgementFailed: string; open: string;
  kinds: Record<ReturnType<typeof assignmentNoticeKind>, string>;
  eventFallback: string;
};

type Props = {
  userId: string;
  initialRows: FieldNotificationRow[];
  initialVisitNames: Record<string, string>;
  locale: "en" | "ar";
  initialFilter: "all" | "unread";
  strings: Strings;
};

const ICONS = {
  assign: { path: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", bg: "var(--status-compliant-soft)", color: "var(--status-compliant-text)" },
  return: { path: "M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1", bg: "var(--status-warning-soft)", color: "var(--status-warning-text)" },
  sync: { path: "M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0 1 14.1-3.5M19.5 15a8 8 0 0 1-14.1 3.5", bg: "var(--surface-sunken)", color: "var(--text-secondary)" },
  calendar: { path: "M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", bg: "var(--accent-soft)", color: "var(--accent-text)" },
  cancel: { path: "M12 9v4M12 16.5h.01M10.3 4.5 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.5a1.5 1.5 0 0 0-2.6 0z", bg: "var(--status-critical-soft)", color: "var(--status-critical-text)" },
} as const;

function iconFor(kind: ReturnType<typeof assignmentNoticeKind>) {
  if (kind === "assigned" || kind === "reassigned") return ICONS.assign;
  if (kind === "released") return ICONS.return;
  if (kind === "cancelled" || kind === "expired") return ICONS.cancel;
  if (kind === "rescheduled") return ICONS.calendar;
  return ICONS.sync;
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
  const [refreshing, setRefreshing] = useState(false);
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
    setRefreshing(true);
    try {
      const live = await loadLive(props.userId);
      setRows(live.rows);
      setVisitNames(live.visitNames);
      saveCache(live.rows, live.visitNames);
      setMessage("");
    } catch {
      setMessage(props.strings.refreshFailed);
    } finally {
      setRefreshing(false);
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

  return (
    <>
      <div className={styles.seg} role="tablist" aria-label={props.strings.eventFallback}>
        <Link role="tab" aria-selected={props.initialFilter === "all"} aria-pressed={props.initialFilter === "all"}
          href="/field/notifications" prefetch={false}>{props.strings.all}</Link>
        <Link role="tab" aria-selected={props.initialFilter === "unread"} aria-pressed={props.initialFilter === "unread"}
          href="/field/notifications?filter=unread" prefetch={false}>{props.strings.unread} ({unreadCount})</Link>
      </div>

      <div className={online ? styles.liveState : styles.offlineState} role="status">
        {online
          ? (refreshing ? props.strings.reconnecting : props.strings.live)
          : (cachedAt
              ? props.strings.offlineCached.replace("{time}", formatDateTime(cachedAt, props.locale))
              : props.strings.offlineEmpty)}
      </div>
      {message && <div className="alert alert-warning" role="alert">{message}</div>}

      <div className={styles.wrap} style={{ flex: 1 }}>
        {visibleRows.length === 0 ? (
          <div className={styles.empty} role="status">
            {props.initialFilter === "unread" ? props.strings.emptyUnread : props.strings.empty}
          </div>
        ) : visibleRows.map(row => {
          const kind = assignmentNoticeKind(row);
          const icon = iconFor(kind);
          const visitId = typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null;
          const detail = visitId && visitNames[visitId]
            ? visitNames[visitId]
            : [row.payload?.reason, row.payload?.decision, row.payload?.factory]
                .find(value => typeof value === "string" && value) as string | undefined;
          const unread = isNotificationUnread(row);
          const detailHref = `/field/notifications/${encodeURIComponent(row.id)}`;
          return (
            <article key={row.id} className={`${styles.row} ${unread ? styles.rowUnread : ""}`}>
              <Link className={styles.rowLink} href={detailHref} prefetch={false}>
                <div className={styles.rowHead}>
                  <div className={styles.rowIdentity}>
                    <span className={styles.icn} style={{ background: icon.bg, color: icon.color }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d={icon.path} />
                      </svg>
                    </span>
                    <div>
                      <strong>{props.strings.kinds[kind] || row.event_key.replace(/_/g, " ")}</strong>
                      {detail && <div className={`t-caption ${styles.clamp2}`}>{detail}</div>}
                    </div>
                  </div>
                  {unread && <span className="badge">{props.strings.newBadge}</span>}
                </div>
                <div className="t-caption">{formatDateTime(row.created_at, props.locale)}</div>
              </Link>
              <div className={styles.actions}>
                <Link className="btn btn-secondary btn-sm" href={detailHref} prefetch={false}>
                  {props.strings.open}
                </Link>
                {unread && (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => void acknowledge(row)}>
                    {props.strings.markRead}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
