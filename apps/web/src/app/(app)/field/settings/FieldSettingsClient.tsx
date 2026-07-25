"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { localForUser, promptLegacyOfflineRestore, type SyncState } from "@/lib/offline";
import styles from "./settings.module.css";

type Locale = "en" | "ar";
type OfflineSnapshot = { state: SyncState; queued: number; conflicts: number };

const initialOffline: OfflineSnapshot = { state: "pending", queued: 0, conflicts: 0 };

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

// The Light/Dark segmented control was removed here: the field channel is fixed
// dark (see ThemeScript), so the control had nothing to switch and writing
// "saqeel-theme" from a field screen would only have changed the WEB console's
// theme — a confusing side effect on a surface that never changes appearance.

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
      setOffline({ state: "failed", queued: 0, conflicts: 0 });
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
    pending: copy(locale, "Pending", "معلّق"),
    syncing: copy(locale, "Syncing", "جارٍ التزامن"),
    conflict: copy(locale, "Conflict", "تعارض"),
    failed: copy(locale, "Unavailable", "غير متاح"),
  };

  const notAvailable = copy(locale, "Not available here", "غير متاح هنا");
  const notYet = copy(locale, "Not yet available", "غير متاح بعد");
  const managedByDevice = copy(locale, "Managed in device settings", "تُدار من إعدادات الجهاز");
  const synced = offline.state === "synced";
  const chevron = locale === "ar" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";

  return (
    <div className={styles.wrap}>
      {/* General — language is a REAL persisted control; text size is governed.
          Appearance is not offered: the field channel is fixed dark
          (see ThemeScript), so there would be nothing to switch. */}
      <SectionLabel>{copy(locale, "General", "عام")}</SectionLabel>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Language", "اللغة")}</span>
          <div className="seg">
            <a className="seg-opt" href="/locale?set=ar" lang="ar" aria-pressed={locale === "ar"}>العربية</a>
            <a className="seg-opt" href="/locale?set=en" lang="en" aria-pressed={locale === "en"}>English</a>
          </div>
        </div>
        <GovernedRow label={copy(locale, "Text size", "حجم النص")} note={copy(locale, "Use device Display settings", "من إعدادات العرض بالجهاز")} />
      </div>

      {/* Notifications — no in-app preference store; iPadOS owns delivery */}
      <SectionLabel>{copy(locale, "Notifications", "الإشعارات")}</SectionLabel>
      <div className={styles.card}>
        <GovernedRow label={copy(locale, "Task & appointment notifications", "إشعارات المهام والمواعيد")} note={managedByDevice} />
        <GovernedRow label={copy(locale, "Urgent alerts", "التنبيهات العاجلة")} note={managedByDevice} />
        <GovernedRow label={copy(locale, "Notification sound", "صوت الإشعارات")} note={managedByDevice} />
        <div className={styles.row}>
          <p className={`t-caption ${styles.note}`}>
            {copy(locale, "Alert delivery is controlled by your device's notification settings, not stored by this app.", "يتحكم في تسليم التنبيهات إعدادات الإشعارات على جهازك، ولا يخزّنها هذا التطبيق.")}
          </p>
        </div>
      </div>

      {/* Security — trusted-devices link is REAL; delegation has no route yet */}
      <SectionLabel>{copy(locale, "Security", "الأمان")}</SectionLabel>
      <div className={styles.card}>
        <Link href="/field/settings/devices" prefetch={false} className={styles.link}>
          <span className={styles.rowLabel}>
            {copy(locale, "Biometric lock & trusted devices", "القفل الحيوي والأجهزة الموثوقة")}
            <span className="t-caption" style={{ display: "block" }}>
              {copy(locale, "Trust is granted only by the backend approval process.", "تُمنح الثقة فقط من خلال عملية الموافقة في الخادم.")}
            </span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
            <path d={chevron} />
          </svg>
        </Link>
        <GovernedRow label={copy(locale, "Absence delegation", "تفويض الغياب")} note={notYet} />
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
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Queued operations", "العمليات في قائمة الانتظار")}</span>
          <span className="t-mono">{offline.queued}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Unresolved conflicts", "التعارضات غير المحلولة")}</span>
          <span className="t-mono">{offline.conflicts}</span>
        </div>
        <GovernedRow label={copy(locale, "Auto-sync", "مزامنة تلقائية")} note={copy(locale, "Managed by the sync engine", "يديرها محرك المزامنة")} />
        <GovernedRow label={copy(locale, "Offline maps", "خرائط بدون اتصال")} note={notYet} />
        <Link href="/field/settings/conflicts" prefetch={false} className={styles.link}>
          <span className={styles.rowLabel}>
            {copy(locale, "Resolve sync conflicts", "حل تعارضات المزامنة")}
            <span className="t-caption" style={{ display: "block" }}>
              {copy(locale, "Compare your local response against the server and choose which to keep.", "قارن إجابتك المحلية بقيمة الخادم واختر أيّهما تبقي.")}
            </span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
            <path d={chevron} />
          </svg>
        </Link>
        <button type="button" className={styles.link} onClick={() => void refreshOffline()}>
          <span className={styles.actionLabel}>{copy(locale, "Refresh sync status", "تحديث حالة المزامنة")}</span>
        </button>
        <div className={styles.row}>
          <p className={`t-caption ${styles.note}`}>
            {copy(locale, "This screen shows status only — it cannot clear drafts, packages, queued work, or conflicts.", "تعرض هذه الشاشة الحالة فقط — ولا يمكنها مسح المسودات أو الحزم أو الأعمال في قائمة الانتظار أو التعارضات.")}
          </p>
        </div>
      </div>

      {/* Data & Storage — this screen holds no device-storage API and no fake
          size or clear action; the real measured readout lives on the linked
          Device readiness screen (navigator.storage estimate, offline shell,
          update state). SCR-IPAD-610 / SPC-OFF-002 / MVP2-REQ-0181. */}
      <SectionLabel>{copy(locale, "Data & Storage", "البيانات والتخزين")}</SectionLabel>
      <div className={styles.card}>
        <Link href="/field/settings/readiness" prefetch={false} className={styles.link}>
          <span className={styles.rowLabel}>
            {copy(locale, "Device readiness", "جاهزية الجهاز")}
            <span className="t-caption" style={{ display: "block" }}>
              {copy(locale, "Storage headroom, offline shell, installed mode and app updates.", "المساحة المتاحة، والهيكل دون اتصال، ووضع التثبيت، وتحديثات التطبيق.")}
            </span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
            <path d={chevron} />
          </svg>
        </Link>
        <GovernedRow label={copy(locale, "Storage used", "المساحة المستخدمة")} note={copy(locale, "Reported in device settings", "تُعرض في إعدادات الجهاز")} />
        <GovernedRow label={copy(locale, "Clear cache", "مسح الذاكرة المؤقتة")} note={notAvailable} />
      </div>

      {/* About — real deployment version when injected; help/privacy have no routes */}
      <SectionLabel>{copy(locale, "About", "حول")}</SectionLabel>
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "App version", "إصدار التطبيق")}</span>
          <span className="t-mono">{appVersion ?? copy(locale, "Set by deployment", "يُحدَّد عند النشر")}</span>
        </div>
        <GovernedRow label={copy(locale, "Help & Support", "المساعدة والدعم")} note={notAvailable} />
        <GovernedRow label={copy(locale, "Privacy Policy", "سياسة الخصوصية")} note={notAvailable} />
      </div>

      <a href="/login/field/logout" className="btn btn-danger btn-block">
        {copy(locale, "Sign out", "تسجيل الخروج")}
      </a>

      <div className="t-caption" style={{ textAlign: "center" }}>
        {copy(locale, "SAQEEL — Ministry of Industry and Mineral Resources © 2026", "صقيل — وزارة الصناعة والثروة المعدنية © 2026")}
      </div>
    </div>
  );
}
