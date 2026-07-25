"use client";
import { useEffect, useState } from "react";

// Update-available banner for the controlled service-worker lifecycle. Shown
// only when a new worker is installed and waiting (see PwaRegister). Textual and
// icon-bearing, never color-only (SPC-OFF-001). Reload activates the waiting
// worker; the controllerchange listener in lib/pwa/client then reloads the page
// with the fresh shell. Dismiss defers — the worker keeps waiting, so the offer
// returns on the next load. Uses SAQEEL DS tokens only (no bare colors).
export default function PwaUpdatePrompt({ onReload, onDismiss }: { onReload: () => void; onDismiss: () => void }) {
  const [ar, setAr] = useState(false);
  const [reloading, setReloading] = useState(false);
  useEffect(() => { setAr(document.documentElement.lang === "ar"); }, []);
  const t = (en: string, arText: string) => (ar ? arText : en);

  return (
    <div
      role="status"
      aria-live="polite"
      data-pwa-update="ready"
      style={{
        position: "fixed",
        insetInline: "12px",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 9999,
        margin: "0 auto",
        maxWidth: 520,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-primary)",
        boxShadow: "var(--shadow-card)",
        color: "var(--text-primary)",
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" style={{ flex: "none", color: "var(--action-primary)" }}>
        <path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M5 21h14" />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t("A new version is ready", "يتوفر إصدار جديد")}</div>
        <div className="t-caption">{t("Reload to get the latest field app. Your saved work is kept.", "أعد التحميل للحصول على أحدث تطبيق ميداني. يُحتفظ بعملك المحفوظ.")}</div>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        data-pwa-update-reload
        disabled={reloading}
        onClick={() => { setReloading(true); onReload(); }}
        style={{ flex: "none" }}
      >
        {reloading ? t("Reloading…", "جارٍ إعادة التحميل…") : t("Reload", "إعادة التحميل")}
      </button>
      <button
        type="button"
        className="btn btn-icon btn-ghost"
        aria-label={t("Dismiss", "إغلاق")}
        onClick={onDismiss}
        style={{ flex: "none" }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
