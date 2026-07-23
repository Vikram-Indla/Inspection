"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { localForUser, promptLegacyOfflineRestore, type SyncState } from "@/lib/offline";

type Locale = "en" | "ar";
type OfflineSnapshot = { state: SyncState; queued: number; conflicts: number };

const initialOffline: OfflineSnapshot = { state: "pending", queued: 0, conflicts: 0 };

function copy(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

export default function FieldSettingsClient({ locale, userId }: { locale: Locale; userId: string }) {
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

  return (
    <div className="ax-field-page">
      <section className="ax-surface ax-panel stack" aria-labelledby="field-settings-preferences">
        <div>
          <h3 id="field-settings-preferences">{copy(locale, "Display preferences", "تفضيلات العرض")}</h3>
          <p className="ax-caption">{copy(locale, "Language and theme are stored on this browser.", "يتم حفظ اللغة والسمة في هذا المتصفح.")}</p>
        </div>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
          <div>
            <strong>{copy(locale, "Language", "اللغة")}</strong>
            <div className="row" style={{ marginBlockStart: "var(--ax-space-100)" }}>
              <a className="ax-btn ax-btn--secondary ax-btn--field" href="/locale?set=en" lang="en" aria-current={locale === "en" ? "true" : undefined}>EN</a>
              <a className="ax-btn ax-btn--secondary ax-btn--field" href="/locale?set=ar" lang="ar" aria-current={locale === "ar" ? "true" : undefined}>AR</a>
            </div>
          </div>
          <div>
            <strong>{copy(locale, "Theme", "السمة")}</strong>
            <div style={{ marginBlockStart: "var(--ax-space-100)" }}>
              <ThemeToggle className="ax-btn ax-btn--secondary ax-btn--field" labels={{
                toLight: copy(locale, "Switch to light mode", "التبديل إلى الوضع الفاتح"),
                toDark: copy(locale, "Switch to dark mode", "التبديل إلى الوضع الداكن"),
              }} />
            </div>
          </div>
        </div>
      </section>

      <section className="ax-surface ax-panel stack" aria-labelledby="field-settings-sync">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <h3 id="field-settings-sync">{copy(locale, "Sync and offline storage", "المزامنة والتخزين دون اتصال")}</h3>
            <p className="ax-caption">{copy(locale, "Read-only status from this device's offline queue and conflict store.", "حالة للقراءة فقط من قائمة الانتظار ومخزن التعارضات على هذا الجهاز.")}</p>
          </div>
          <span className={`ax-lozenge ${offline.state === "synced" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{stateLabel[offline.state]}</span>
        </div>
        <dl className="ax-grid-2" style={{ margin: 0 }}>
          <div><dt className="ax-caption">{copy(locale, "Queued operations", "العمليات في قائمة الانتظار")}</dt><dd className="ax-numeric" style={{ margin: 0 }}>{offline.queued}</dd></div>
          <div><dt className="ax-caption">{copy(locale, "Unresolved conflicts", "التعارضات غير المحلولة")}</dt><dd className="ax-numeric" style={{ margin: 0 }}>{offline.conflicts}</dd></div>
        </dl>
        <div>
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--field" onClick={() => void refreshOffline()}>{copy(locale, "Refresh status", "تحديث الحالة")}</button>
        </div>
        <p className="ax-caption">{copy(locale, "This screen cannot clear drafts, packages, queued work, or conflicts.", "لا يمكن لهذه الشاشة مسح المسودات أو الحزم أو الأعمال في قائمة الانتظار أو التعارضات.")}</p>
      </section>

      <section className="ax-surface ax-panel" style={{ padding: 0 }} aria-labelledby="field-settings-device">
        <Link href="/field/settings/devices" prefetch={false}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ax-space-300)", textDecoration: "none", color: "inherit" }}>
          <div>
            <h3 id="field-settings-device" style={{ margin: 0 }}>{copy(locale, "Biometric & trusted devices", "البصمة والأجهزة الموثوقة")}</h3>
            <p className="ax-caption" style={{ margin: 0 }}>{copy(locale, "Trust is granted only by the backend approval process.", "تُمنح الثقة فقط من خلال عملية الموافقة في الخادم.")}</p>
          </div>
          <span aria-hidden="true" style={{ color: "var(--ax-color-text-secondary)" }}>→</span>
        </Link>
      </section>
    </div>
  );
}
