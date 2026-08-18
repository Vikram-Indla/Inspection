"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import { localForUser, promptLegacyOfflineRestore, type SyncState } from "@/lib/offline";
import { GovernedRow, LinkRow, Section, SettingRow } from "./settings-section";
import styles from "./settings.module.css";

type OfflineSnapshot = { state: SyncState; queued: number | null; conflicts: number | null };

const initialOffline: OfflineSnapshot = { state: "pending", queued: null, conflicts: null };

const SYNC_TONE: Readonly<Record<SyncState, StatusTone>> = {
  synced: "success",
  offline: "warning",
  pending: "pending",
  syncing: "info",
  conflict: "danger",
  failed: "danger",
};

export default function SettingsPanels({ userId, appVersion, locale, copy }: {
  userId: string;
  appVersion: string | null;
  locale: "en" | "ar";
  copy: Messages["fieldSettings"];
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const [offline, setOffline] = useState<OfflineSnapshot>(initialOffline);

  const refreshOffline = useCallback(async () => {
    try {
      const [queued, conflicts] = await Promise.all([local.peekAll(), local.conflicts()]);
      const state: SyncState = !navigator.onLine
        ? "offline"
        : conflicts.length > 0
          ? "conflict"
          : queued.length > 0
            ? "pending"
            : "synced";
      setOffline({ state, queued: queued.length, conflicts: conflicts.length });
    } catch {
      setOffline({ state: "failed", queued: null, conflicts: null });
    }
  }, [local]);

  useEffect(() => {
    void promptLegacyOfflineRestore(userId).then(refreshOffline).catch(() => refreshOffline());
    window.addEventListener("online", refreshOffline);
    window.addEventListener("offline", refreshOffline);
    return () => {
      window.removeEventListener("online", refreshOffline);
      window.removeEventListener("offline", refreshOffline);
    };
  }, [refreshOffline, userId]);

  const notConfigured = copy.notConfigured;

  return (
    <div className={styles.page}>
      <Section label={copy.sections.general}>
        <SettingRow label={copy.general.appearance}>
          <ThemeToggle className={styles.themeButton} labels={copy.theme} />
        </SettingRow>
        <SettingRow label={copy.general.language}>
          <span className={styles.langSwitch} role="group" aria-label={copy.language.switch}>
            <Link
              href="/locale?set=ar"
              prefetch={false}
              lang="ar"
              aria-current={locale === "ar" ? "true" : undefined}
              data-active={locale === "ar" ? "" : undefined}
              className={styles.langOption}
            >
              {copy.language.arabic}
            </Link>
            <Link
              href="/locale?set=en"
              prefetch={false}
              lang="en"
              aria-current={locale === "en" ? "true" : undefined}
              data-active={locale === "en" ? "" : undefined}
              className={styles.langOption}
            >
              {copy.language.english}
            </Link>
          </span>
        </SettingRow>
        <GovernedRow label={copy.general.textSize} note={notConfigured} />
      </Section>

      <Section label={copy.sections.notifications}>
        <GovernedRow label={copy.notifications.tasks} note={notConfigured} />
        <GovernedRow label={copy.notifications.urgent} note={notConfigured} />
        <GovernedRow label={copy.notifications.sound} note={notConfigured} />
      </Section>

      <Section label={copy.sections.security}>
        <LinkRow label={copy.security.devices} href="/field/settings/devices" />
        <GovernedRow label={copy.security.delegation} note={notConfigured} />
        <div className={styles.note}>
          <Text role="label" tone="muted">{copy.security.audit}</Text>
        </div>
      </Section>

      <Section label={copy.sections.connectivity}>
        <SettingRow label={copy.connectivity.syncStatus}>
          <StatusPill tone={SYNC_TONE[offline.state]} ping={false}>{copy.syncState[offline.state]}</StatusPill>
        </SettingRow>
        <LinkRow label={copy.connectivity.conflicts} href="/field/settings/conflicts" />
        <GovernedRow label={copy.connectivity.autoSync} note={notConfigured} />
        <GovernedRow label={copy.connectivity.offlineMaps} note={notConfigured} />
        <button type="button" className={styles.action} onClick={() => void refreshOffline()}>
          <Text role="label" tone="accent" as="span">{copy.connectivity.syncNow}</Text>
        </button>
      </Section>

      <Section label={copy.sections.data}>
        <LinkRow label={copy.data.readiness} href="/field/settings/readiness" />
        <GovernedRow label={copy.data.storageUsed} note={notConfigured} />
        <GovernedRow label={copy.data.clearCache} note={notConfigured} />
      </Section>

      <Section label={copy.sections.about}>
        <SettingRow label={copy.about.appVersion}>
          <Mono as="span">{appVersion ?? copy.about.appVersionDefault}</Mono>
        </SettingRow>
        <GovernedRow label={copy.about.help} note={notConfigured} />
        <GovernedRow label={copy.about.privacy} note={notConfigured} />
      </Section>

      <a href="/signout" className={styles.signOut}>
        <Text role="label" tone="inverse" as="span">{copy.signOut}</Text>
      </a>

      <Text role="label" tone="muted" align="center" as="p">{copy.copyright}</Text>
    </div>
  );
}
