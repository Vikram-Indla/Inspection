"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { localForUser, promptLegacyOfflineRestore, type SyncState } from "@/lib/offline";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./settings.module.css";

type Locale = "en" | "ar";
type OfflineSnapshot = { state: SyncState; queued: number | null; conflicts: number | null };

const initialOffline: OfflineSnapshot = { state: "pending", queued: null, conflicts: null };

function copy(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

// Section groupings, order and labels mirror "SAQEEL Field Settings.dc.html"
// (General, Notifications, Security, Connectivity & Sync, Data & Storage, About,
// Sign out). The design mock renders several live-looking switches (text size,
// notification prefs, auto-sync, offline maps) and decorative values (142 MB
// cache, hard-coded version) with NO backing store or action here. Per CLAUDE.md
// we never fabricate capability: those appear under their design headings as
// governed, clearly non-interactive rows — never a switch that does nothing.
// Only controls that truly persist/act stay interactive: theme, language,
// offline-queue status + refresh, trusted-devices link, sign out.

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className={styles.label}>{children}</div>;
}

// A design row with no real backing store/action: label on the start, a muted
// governed note on the end — deliberately not a control.
function GovernedRow({ label, note }: { label: string; note: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className="t-caption" style={{ flex: "none" }}>{note}</span>
    </div>
  );
}

export default function FieldSettingsClient({
  locale,
  userId,
  appVersion,
}: {
  locale: Locale;
  userId: string;
  appVersion: string | null;
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

  const stateLabel: Record<SyncState, string> = {
    synced: copy(locale, "Synced", "متزامن"),
    offline: copy(locale, "Offline", "غير متصل"),
    pending: copy(locale, "Loading…", "جارٍ التحميل…"),
    syncing: copy(locale, "Syncing", "جارٍ التزامن"),
    conflict: copy(locale, "Conflict", "تعارض"),
    failed: copy(locale, "Unavailable", "غير متاح"),
  };

  const notConfigured = copy(locale, "Not configured", "غير مهيأ");
  const synced = offline.state === "synced";
  const chevron = locale === "ar" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";

  return (
    <div className={styles.wrap}>
      {/* General — design row order is Appearance, Language, Text size.
          Appearance and language are real application-wide controls. */}
      <SectionLabel>{copy(locale, "General", "عام")}</SectionLabel>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Appearance", "المظهر")}</span>
          <ThemeToggle
            className="btn btn-secondary btn-touch"
            labels={{
              toLight: copy(locale, "Switch to light mode", "التبديل إلى الوضع الفاتح"),
              toDark: copy(locale, "Switch to dark mode", "التبديل إلى الوضع الداكن"),
            }}
          />
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Language", "اللغة")}</span>
          <div className="seg">
            <a className="seg-opt" href="/locale?set=ar" lang="ar" aria-pressed={locale === "ar"}>العربية</a>
            <a className="seg-opt" href="/locale?set=en" lang="en" aria-pressed={locale === "en"}>English</a>
          </div>
        </div>
        <GovernedRow label={copy(locale, "Text size", "حجم النص")} note={notConfigured} />
      </div>

      {/* Notifications — no in-app preference store; iPadOS owns delivery */}
      <SectionLabel>{copy(locale, "Notifications", "الإشعارات")}</SectionLabel>
      <div className={styles.card}>
        <GovernedRow label={copy(locale, "Task & appointment notifications", "إشعارات المهام والمواعيد")} note={notConfigured} />
        <GovernedRow label={copy(locale, "Urgent alerts", "التنبيهات العاجلة")} note={notConfigured} />
        <GovernedRow label={copy(locale, "Notification sound", "صوت الإشعارات")} note={notConfigured} />
      </div>

      {/* Security — trusted-devices link is REAL; delegation has no route yet */}
      <SectionLabel>{copy(locale, "Security", "الأمان")}</SectionLabel>
      <div className={styles.card}>
        <Link href="/field/settings/devices" prefetch={false} className={styles.link}>
          <span className={styles.rowLabel}>
            {copy(locale, "Biometric lock & trusted devices", "القفل الحيوي والأجهزة الموثوقة")}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
            <path d={chevron} />
          </svg>
        </Link>
        <GovernedRow label={copy(locale, "Absence delegation", "تفويض الغياب")} note={notConfigured} />
        <div className={styles.row}>
          <p className={`t-caption ${styles.note}`}>
            {copy(locale, "Every action in your session is logged and audited · Encrypted connection", "كل إجراء داخل جلستك موثّق ومراجَع · اتصال مشفّر")}
          </p>
        </div>
      </div>

      {/* Connectivity & Sync — offline queue status + refresh are REAL, read-only */}
      <SectionLabel>{copy(locale, "Connectivity & Sync", "الاتصال والمزامنة")}</SectionLabel>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.dot} style={{ background: synced ? "var(--status-compliant-text)" : "var(--status-warning-text)" }} aria-hidden="true" />
          <span className={styles.rowLabel}>{copy(locale, "Sync status", "حالة المزامنة")}</span>
          <span className={`badge ${synced ? "badge-compliant" : "badge-warning"}`}>{stateLabel[offline.state]}</span>
        </div>
        <Link href="/field/settings/conflicts" prefetch={false} className={styles.link}>
          <span className={styles.rowLabel}>{copy(locale, "Conflict Resolution", "حل التعارضات")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
            <path d={chevron} />
          </svg>
        </Link>
        <GovernedRow label={copy(locale, "Auto-sync", "مزامنة تلقائية")} note={notConfigured} />
        <GovernedRow label={copy(locale, "Offline maps", "خرائط بدون اتصال")} note={notConfigured} />
        <button type="button" className={styles.link} onClick={() => void refreshOffline()}>
          <span className={styles.actionLabel}>{copy(locale, "Sync now", "مزامنة الآن")}</span>
        </button>
      </div>

      {/* Data & Storage — no device-storage API here; no fake size or clear action */}
      <SectionLabel>{copy(locale, "Data & Storage", "البيانات والتخزين")}</SectionLabel>
      <div className={styles.card}>
        <GovernedRow label={copy(locale, "Storage used", "المساحة المستخدمة")} note={notConfigured} />
        <GovernedRow label={copy(locale, "Clear cache", "مسح الذاكرة المؤقتة")} note={notConfigured} />
      </div>

      {/* About — real deployment version when injected; help/privacy have no routes */}
      <SectionLabel>{copy(locale, "About", "حول")}</SectionLabel>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "App version", "إصدار التطبيق")}</span>
          <span className="t-mono">{appVersion ?? copy(locale, "Set by deployment", "يُحدَّد عند النشر")}</span>
        </div>
        <GovernedRow label={copy(locale, "Help & Support", "المساعدة والدعم")} note={notConfigured} />
        <GovernedRow label={copy(locale, "Privacy Policy", "سياسة الخصوصية")} note={notConfigured} />
      </div>

      <a href="/signout" className="btn btn-danger btn-block">
        {copy(locale, "Sign out", "تسجيل الخروج")}
      </a>

      <div className="t-caption" style={{ textAlign: "center" }}>
        {copy(locale, "SAQEEL — Ministry of Industry and Mineral Resources © 2026", "صقيل — وزارة الصناعة والثروة المعدنية © 2026")}
      </div>
    </div>
  );
}
