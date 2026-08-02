"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { readDeviceReadiness, requestPersistentStorage, type DeviceReadinessSnapshot } from "@/lib/pwa/client";
import { formatBytes } from "@/lib/pwa/readiness";
import styles from "../settings.module.css";

type Locale = "en" | "ar";

function copy(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

type Tone = "ok" | "warn" | "muted";

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  // Non-color-only (SPC-OFF-001): the badge always carries a text label; the
  // tone class only reinforces it. "muted" = honest unknown, never a fake state.
  const cls = tone === "ok" ? "badge badge-compliant" : tone === "warn" ? "badge badge-warning" : "badge";
  return <span className={cls}>{children}</span>;
}

function StatusRow({ label, tone, badge, note }: { label: string; tone: Tone; badge: string; note?: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>
        {label}
        {note ? <span className="t-caption" style={{ display: "block" }}>{note}</span> : null}
      </span>
      <Badge tone={tone}>{badge}</Badge>
    </div>
  );
}

export default function DeviceReadinessClient({ locale, appVersion }: { locale: Locale; appVersion: string | null }) {
  const [snap, setSnap] = useState<DeviceReadinessSnapshot | null>(null);
  const [persisting, setPersisting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSnap(await readDeviceReadiness());
    } catch {
      setSnap(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onVis = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const requestPersist = useCallback(async () => {
    setPersisting(true);
    try {
      await requestPersistentStorage();
      await refresh();
    } finally {
      setPersisting(false);
    }
  }, [refresh]);

  const unknown = copy(locale, "Unknown", "غير معروف");

  // ---- Offline / shell ----
  const shell = snap?.shell;
  const shellRow = {
    ready: { tone: "ok" as Tone, badge: copy(locale, "Ready", "جاهز") },
    not_cached: { tone: "warn" as Tone, badge: copy(locale, "Not cached yet", "غير مخزّن بعد") },
    no_controller: { tone: "warn" as Tone, badge: copy(locale, "Starting", "قيد البدء") },
    unsupported: { tone: "muted" as Tone, badge: copy(locale, "Unsupported", "غير مدعوم") },
  }[shell ?? "unsupported"];

  const display = snap?.display;
  const displayRow = {
    standalone: { tone: "ok" as Tone, badge: copy(locale, "Installed app", "تطبيق مثبّت") },
    browser: { tone: "muted" as Tone, badge: copy(locale, "In browser", "في المتصفح") },
    unknown: { tone: "muted" as Tone, badge: unknown },
  }[display ?? "unknown"];

  const update = snap?.update;
  const updateRow = {
    current: { tone: "ok" as Tone, badge: copy(locale, "Up to date", "محدّث") },
    update_ready: { tone: "warn" as Tone, badge: copy(locale, "Update ready", "تحديث جاهز") },
    unregistered: { tone: "muted" as Tone, badge: copy(locale, "Not registered", "غير مسجّل") },
    unsupported: { tone: "muted" as Tone, badge: copy(locale, "Unsupported", "غير مدعوم") },
  }[update ?? "unsupported"];

  // ---- Storage ----
  const storage = snap?.storage;
  const storageMeasured = storage?.measured && storage.quotaBytes !== null;
  const storageTone: Tone = !storage ? "muted" : storage.state === "ample" ? "ok" : storage.state === "constrained" ? "warn" : "muted";
  const storageBadge = !storage || storage.state === "unknown"
    ? unknown
    : storage.state === "ample"
      ? copy(locale, "Ample", "كافٍ")
      : copy(locale, "Low", "منخفض");
  // MVP2-REQ-0181 — when storage is constrained, state the exact fix.
  const storageFix = storage?.state === "constrained"
    ? copy(
        locale,
        `Free up space in iPadOS Settings before travel — ${formatBytes(storage.availableBytes)} free.`,
        `أفرغ مساحة من إعدادات iPadOS قبل السفر — ${formatBytes(storage.availableBytes)} متاحة.`,
      )
    : undefined;

  const persistence = snap?.persistence;
  const persistRow = {
    persisted: { tone: "ok" as Tone, badge: copy(locale, "Persistent", "دائم") },
    best_effort: { tone: "muted" as Tone, badge: copy(locale, "Best effort", "أفضل جهد") },
    unknown: { tone: "muted" as Tone, badge: unknown },
  }[persistence ?? "unknown"];

  const loading = snap === null;

  return (
    <div className={styles.wrap} data-readiness-ready={loading ? "loading" : "ready"}>
      {/* Offline readiness — what the inspector can rely on without a network
          (SPC-OFF-002, FND-005). Every value is measured, never assumed. */}
      <div className={styles.label}>{copy(locale, "Offline readiness", "الجاهزية دون اتصال")}</div>
      <div className={styles.card}>
        <StatusRow
          label={copy(locale, "Offline app shell", "هيكل التطبيق دون اتصال")}
          tone={loading ? "muted" : shellRow.tone}
          badge={loading ? copy(locale, "Checking…", "جارٍ الفحص…") : shellRow.badge}
          note={copy(locale, "The field app can start offline once the shell is cached.", "يمكن لتطبيق الميدان أن يبدأ دون اتصال بمجرد تخزين الهيكل.")}
        />
        <StatusRow
          label={copy(locale, "Installed mode", "وضع التثبيت")}
          tone={loading ? "muted" : displayRow.tone}
          badge={loading ? "…" : displayRow.badge}
          note={display === "browser" ? copy(locale, "Add to Home Screen for a full-screen field app and push alerts.", "أضِف إلى الشاشة الرئيسية للحصول على تطبيق ميداني بملء الشاشة وتنبيهات فورية.") : undefined}
        />
        <StatusRow
          label={copy(locale, "App version state", "حالة إصدار التطبيق")}
          tone={loading ? "muted" : updateRow.tone}
          badge={loading ? "…" : updateRow.badge}
          note={update === "update_ready" ? copy(locale, "A new version is ready — reload from the banner to apply it.", "يتوفر إصدار جديد — أعد التحميل من الشريط لتطبيقه.") : undefined}
        />
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "App version", "إصدار التطبيق")}</span>
          <span className="t-mono">{appVersion ?? copy(locale, "Set by deployment", "يُحدَّد عند النشر")}</span>
        </div>
      </div>

      {/* Storage — measured headroom for the offline package and outbox
          (SCR-IPAD-610 "storage low"). Raw bytes are always shown so the number
          speaks for itself regardless of the advisory. */}
      <div className={styles.label}>{copy(locale, "Storage", "التخزين")}</div>
      <div className={styles.card}>
        <StatusRow
          label={copy(locale, "Storage headroom", "المساحة المتاحة")}
          tone={loading ? "muted" : storageTone}
          badge={loading ? copy(locale, "Checking…", "جارٍ الفحص…") : storageBadge}
          note={storageFix}
        />
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Used of available", "المستخدم من المتاح")}</span>
          <span className="t-mono">
            {storageMeasured ? `${formatBytes(storage!.usageBytes)} / ${formatBytes(storage!.quotaBytes)}` : "—"}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{copy(locale, "Free", "المتبقّي")}</span>
          <span className="t-mono">{storageMeasured ? formatBytes(storage!.availableBytes) : "—"}</span>
        </div>
        <StatusRow
          label={copy(locale, "Persistent storage", "تخزين دائم")}
          tone={loading ? "muted" : persistRow.tone}
          badge={loading ? "…" : persistRow.badge}
          note={copy(locale, "Persistent storage protects offline drafts from being evicted under pressure.", "يحمي التخزين الدائم المسودات دون اتصال من الحذف عند الضغط.")}
        />
        {persistence !== "persisted" ? (
          <button type="button" className={styles.link} onClick={() => void requestPersist()} disabled={persisting} data-action="request-persist">
            <span className={styles.actionLabel}>
              {persisting ? copy(locale, "Requesting…", "جارٍ الطلب…") : copy(locale, "Request persistent storage", "طلب تخزين دائم")}
            </span>
          </button>
        ) : null}
        <button type="button" className={styles.link} onClick={() => void refresh()} data-action="recheck">
          <span className={styles.actionLabel}>{copy(locale, "Re-check device", "إعادة فحص الجهاز")}</span>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <p className={`t-caption ${styles.note}`}>
            {copy(
              locale,
              "This screen reads device state only — it cannot clear drafts, packages, queued work, or conflicts.",
              "تقرأ هذه الشاشة حالة الجهاز فقط — ولا يمكنها مسح المسودات أو الحزم أو الأعمال في قائمة الانتظار أو التعارضات.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
