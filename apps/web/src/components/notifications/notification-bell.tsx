"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Icon from "@/components/saqeel/icon/icon";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import { Heading } from "@/components/saqeel/type/heading";
import { Text } from "@/components/saqeel/type/text";
import type { NotificationStrings } from "@/features/shell/notification-strings";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { notificationHref } from "@/lib/notification-read";
import { eventLabel, notificationContent } from "./notification-content";
import {
  isUnread,
  loadNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_POLL_MS,
  type NotificationFeed,
  type NotificationRecord,
} from "./notification-feed";
import NotificationRow from "./notification-row";
import { notificationTime } from "./notification-time";
import { notificationTone } from "./notification-tone";
import styles from "./notification-bell.module.css";

const BADGE_CEILING = 99;
const FIELD_LIST_HREF = "/field/notifications";
const EMPTY_FEED: NotificationFeed = { rows: [], unreadTotal: 0, total: 0, visitContexts: {} };

type Tab = "all" | "unread";

export default function NotificationBell({ strings, locale, fieldOnly = false }: {
  strings: NotificationStrings;
  locale: Locale;
  fieldOnly?: boolean;
}) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [feed, setFeed] = useState<NotificationFeed>(EMPTY_FEED);
  const [signedIn, setSignedIn] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const refresh = useCallback(async (force: boolean) => {
    try {
      const next = await loadNotificationFeed(force);
      setSignedIn(next !== null);
      setFailed(false);
      if (next) setFeed(next);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(false);
    }, NOTIFICATION_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  if (!signedIn) return null;

  const unread = Math.max(feed.unreadTotal, feed.rows.filter(isUnread).length);
  const visible = tab === "unread" ? feed.rows.filter(isUnread) : feed.rows;
  const now = new Date();

  async function apply(action: Promise<NotificationFeed | null>) {
    try {
      const next = await action;
      if (next) setFeed(next);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className={styles.root}>
      <button
        className={styles.trigger}
        type="button"
        ref={triggerRef}
        aria-label={unread > 0 ? fill(strings.triggerLabelWithUnread, { count: unread }) : strings.triggerLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => {
          setIsOpen(open => !open);
          if (!isOpen) void refresh(true);
        }}
      >
        <Icon name="notify" size="md" />
        {unread > 0 ? (
          <span className={styles.badge}>
            <CountBadge value={unread > BADGE_CEILING ? `${BADGE_CEILING}+` : unread} tone="danger" superscript />
          </span>
        ) : null}
      </button>

      <MenuSurface
        id={panelId}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        align="end"
        label={strings.heading}
        role="dialog"
        trapFocus
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.headline}>
              <Heading level={2} visual="subheading">{strings.heading}</Heading>
              {unread > 0 ? (
                <Text role="label" tone="muted" as="span" numeric>
                  {fill(strings.unreadCount, { count: unread })}
                </Text>
              ) : null}
            </span>
            {unread > 0 ? (
              <button className={styles.textAction} type="button" onClick={() => void apply(markAllNotificationsRead())}>
                <Text role="label" tone="accent" as="span">{strings.markAllRead}</Text>
              </button>
            ) : null}
          </div>

          <div className={styles.tabs}>
            <button className={styles.tab} type="button" aria-pressed={tab === "all"} onClick={() => setTab("all")}>
              <Text role="label" tone="inherit" as="span">{strings.tabs.all}</Text>
            </button>
            <button className={styles.tab} type="button" aria-pressed={tab === "unread"} onClick={() => setTab("unread")}>
              <Text role="label" tone="inherit" as="span">{strings.tabs.unread}</Text>
            </button>
          </div>

          <div className={styles.scroller}>
            {failed ? (
              <EmptyState icon="risk" title={strings.error} tone="danger" size="sm" variant="inline" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon="notify"
                title={tab === "unread" ? strings.empty.unread : strings.empty.all}
                size="sm"
                variant="inline"
              />
            ) : (
              <ul className={styles.list}>
                {visible.map((row: NotificationRecord) => {
                  const content = notificationContent(row, feed.visitContexts, strings.context);
                  return (
                    <NotificationRow
                      key={row.id}
                      tone={notificationTone(row.event_key)}
                      eventLabel={eventLabel(strings.events, row.event_key)}
                      timeLabel={notificationTime(row.created_at, locale, now, strings.justNow)}
                      unread={isUnread(row)}
                      unreadTag={strings.unreadTag}
                      subject={content.subject}
                      meta={content.meta}
                      detail={content.detail}
                      href={notificationHref(row.event_key, row.payload, fieldOnly)}
                      onOpen={() => { if (isUnread(row)) void apply(markNotificationRead(row)); }}
                    />
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.footer}>
            <Text role="label" tone="muted" as="span" numeric>
              {fill(strings.shown, { shown: visible.length, total: feed.total })}
            </Text>
            {fieldOnly ? (
              <Link
                className={styles.footerAction}
                href={FIELD_LIST_HREF}
                prefetch={false}
                onClick={() => setIsOpen(false)}
              >
                <Text role="label" tone="accent" as="span">{strings.viewAll}</Text>
              </Link>
            ) : null}
          </div>
        </div>
      </MenuSurface>
    </div>
  );
}
