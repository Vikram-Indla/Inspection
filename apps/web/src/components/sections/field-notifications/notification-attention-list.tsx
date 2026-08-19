"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text } from "@/components/saqeel/type";
import { formatDateTime } from "@/lib/dates";
import {
  fieldNotificationCacheKey,
  parseFieldNotificationCache,
  type FieldNotificationRow,
} from "@/lib/field-notifications";
import { isNotificationUnread, notificationReadPatch } from "@/lib/notification-read";
import { supabaseBrowser } from "@/lib/supabase";
import { notificationVisitIds, toVisitNames } from "@/features/field-notifications/rows";
import type { Messages } from "@/i18n/messages";
import { fill } from "@/i18n/messages";
import NotificationRow from "./notification-row";
import styles from "./notifications.module.css";

type Copy = Messages["fieldNotifications"];

async function loadLive(userId: string) {
  const sb = supabaseBrowser();
  const { data, error } = await sb.from("notifications")
    .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
    .eq("recipient", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as FieldNotificationRow[];
  const visitIds = notificationVisitIds(rows);
  const visitNames: Record<string, string> = {};
  if (visitIds.length > 0) {
    const context = await sb.from("visits").select("id, factories(name)").in("id", visitIds);
    if (context.error) throw context.error;
    Object.assign(visitNames, toVisitNames(context.data));
  }
  return { rows, visitNames };
}

export default function NotificationAttentionList({ userId, initialRows, initialVisitNames, locale, filter, copy }: {
  userId: string;
  initialRows: readonly FieldNotificationRow[];
  initialVisitNames: Record<string, string>;
  locale: "en" | "ar";
  filter: "all" | "unread";
  copy: Copy;
}) {
  const [rows, setRows] = useState<readonly FieldNotificationRow[]>(initialRows);
  const [visitNames, setVisitNames] = useState(initialVisitNames);
  const [online, setOnline] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const storageKey = fieldNotificationCacheKey(userId);

  const saveCache = useCallback((nextRows: readonly FieldNotificationRow[], nextNames: Record<string, string>) => {
    const nextCachedAt = new Date().toISOString();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ userId, cachedAt: nextCachedAt, rows: nextRows, visitNames: nextNames }));
      setCachedAt(nextCachedAt);
    } catch {
      setCachedAt(cachedAt);
    }
  }, [userId, storageKey, cachedAt]);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const live = await loadLive(userId);
      setRows(live.rows);
      setVisitNames(live.visitNames);
      saveCache(live.rows, live.visitNames);
      setMessage("");
    } catch {
      setMessage(copy.refreshFailed);
    }
  }, [userId, copy.refreshFailed, saveCache]);

  useEffect(() => {
    const isOnline = navigator.onLine;
    setOnline(isOnline);
    const cached = parseFieldNotificationCache(localStorage.getItem(storageKey), userId);
    if (!isOnline && cached) {
      setRows(cached.rows);
      setVisitNames(cached.visitNames);
      setCachedAt(cached.cachedAt);
    } else if (isOnline) {
      saveCache(initialRows, initialVisitNames);
    }
    const onOffline = () => {
      setOnline(false);
      const snapshot = parseFieldNotificationCache(localStorage.getItem(storageKey), userId);
      if (snapshot) {
        setRows(snapshot.rows);
        setVisitNames(snapshot.visitNames);
        setCachedAt(snapshot.cachedAt);
      }
    };
    const onOnline = () => {
      setOnline(true);
      setMessage(copy.reconnecting);
      void refresh();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [initialRows, initialVisitNames, copy.reconnecting, userId, refresh, saveCache, storageKey]);

  const acknowledge = useCallback(async (row: FieldNotificationRow) => {
    if (!online) {
      setMessage(copy.ackOffline);
      return;
    }
    const patch = notificationReadPatch(row.delivery_state, new Date().toISOString());
    const { data, error } = await supabaseBrowser().from("notifications")
      .update(patch)
      .eq("id", row.id)
      .eq("recipient", userId)
      .is("read_at", null)
      .select("id");
    if (error || !data?.length) {
      setMessage(copy.ackFailed);
      return;
    }
    const nextRows = rows.map(item => (item.id === row.id ? { ...item, ...patch } as FieldNotificationRow : item));
    setRows(nextRows);
    saveCache(nextRows, visitNames);
    setMessage("");
  }, [online, copy.ackOffline, copy.ackFailed, rows, userId, saveCache, visitNames]);

  const visibleRows = useMemo(
    () => (filter === "unread" ? rows.filter(isNotificationUnread) : rows),
    [filter, rows],
  );
  const unreadCount = rows.filter(isNotificationUnread).length;

  const offlineNotice = online
    ? null
    : cachedAt
      ? fill(copy.offlineCached, { time: formatDateTime(cachedAt, locale) })
      : copy.offlineEmpty;

  return (
    <>
      <div className={styles.seg}>
        <Link href="/field/notifications" prefetch={false} aria-current={filter === "all" ? "page" : undefined}
          className={`${styles.segTab} ${filter === "all" ? styles.segTabActive : ""}`}>
          <Text role="label" as="span" tone={filter === "all" ? "inherit" : "secondary"}>{copy.filter.all}</Text>
        </Link>
        <Link href="/field/notifications?filter=unread" prefetch={false} aria-current={filter === "unread" ? "page" : undefined}
          className={`${styles.segTab} ${filter === "unread" ? styles.segTabActive : ""}`}>
          <Text role="label" as="span" tone={filter === "unread" ? "inherit" : "secondary"}>{`${copy.filter.unread} (${unreadCount})`}</Text>
        </Link>
      </div>

      <div className={styles.page}>
        {offlineNotice ? <Text tone="warning" live="status" role="label">{offlineNotice}</Text> : null}
        {message ? <Text tone="warning" live="alert" role="label">{message}</Text> : null}

        {visibleRows.length === 0 ? (
          <Text tone="secondary" align="center" live="status">{copy.empty}</Text>
        ) : (
          <ul className={styles.list}>
            {visibleRows.map(row => (
              <NotificationRow
                key={row.id}
                row={row}
                visitNames={visitNames}
                locale={locale}
                copy={copy}
                onAcknowledge={ack => void acknowledge(ack)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
