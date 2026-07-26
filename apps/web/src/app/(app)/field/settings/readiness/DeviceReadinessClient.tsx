"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  formatBytes,
  readDeviceReadiness,
  requestPersistentStorage,
  type DeviceReadinessSnapshot,
} from "@/lib/device-readiness";
import styles from "../settings.module.css";
import readinessStyles from "./readiness.module.css";

type Locale = "en" | "ar";
type Tone = "ok" | "warn" | "muted";

function copy(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const cls = tone === "ok" ? "badge badge-compliant" : tone === "warn" ? "badge badge-warning" : "badge";
  return <span className={cls}>{children}</span>;
}

function StatusRow({ label, tone, badge, note }: { label: string; tone: Tone; badge: string; note?: string }) {
  return (
    <div className={`${styles.row} ${readinessStyles.statusRow}`}>
      <span className={styles.rowLabel}>
        {label}
        {note ? <span className="t-caption" style={{ display: "block", color: "var(--text-secondary)" }}>{note}</span> : null}
      </span>
      <span className={readinessStyles.statusBadge}><Badge tone={tone}>{badge}</Badge></span>
    </div>
  );
}

export default function DeviceReadinessClient({ locale }: { locale: Locale }) {
  const [snapshot, setSnapshot] = useState<DeviceReadinessSnapshot | null>(null);
  const [persisting, setPersisting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await readDeviceReadiness());
    } catch {
      setSnapshot(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const onConnectivity = () => { void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onConnectivity);
    window.addEventListener("offline", onConnectivity);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onConnectivity);
      window.removeEventListener("offline", onConnectivity);
    };
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
  const loading = snapshot === null;
  const connectivity = snapshot?.connectivity ?? "unknown";
  const connectivityRow = {
    online: { tone: "ok" as Tone, badge: copy(locale, "Online", "متصل") },
    offline: { tone: "warn" as Tone, badge: copy(locale, "Offline", "دون اتصال") },
    unknown: { tone: "muted" as Tone, badge: unknown },
  }[connectivity];

  const storage = snapshot?.storage;
  const storageMeasured = storage?.measured && storage.quotaBytes !== null;
  const storageTone: Tone = !storage ? "muted" : storage.state === "ample" ? "ok" : storage.state === "constrained" ? "warn" : "muted";
  const storageBadge = !storage || storage.state === "unknown"
    ? unknown
    : storage.state === "ample"
      ? copy(locale, "Ample", "كافٍ")
      : copy(locale, "Low", "منخفض");
  const storageFix = storage?.state === "constrained"
    ? copy(
        locale,
        `Free up space in device settings before travel — ${formatBytes(storage.availableBytes)} free.`,
        `أفرغ مساحة من إعدادات الجهاز قبل الانتقال — ${formatBytes(storage.availableBytes)} متاحة.`,
      )
    : undefined;

  const persistence = snapshot?.persistence;
  const persistenceRow = {
    persisted: { tone: "ok" as Tone, badge: copy(locale, "Persistent", "دائم") },
    best_effort: { tone: "muted" as Tone, badge: copy(locale, "Best effort", "أفضل جهد") },
    unknown: { tone: "muted" as Tone, badge: unknown },
  }[persistence ?? "unknown"];

  return (
    <div className={styles.wrap} data-readiness-ready={loading ? "loading" : "ready"}>
      <h1 className="sr-only">{copy(locale, "Device readiness", "جاهزية الجهاز")}</h1>
      <div className={styles.label} style={{ color: "var(--text-secondary)" }}>{copy(locale, "Browser delivery", "التشغيل عبر المتصفح")}</div>
      <div className={styles.card}>
        <StatusRow
          label={copy(locale, "Network", "الشبكة")}
          tone={loading ? "muted" : connectivityRow.tone}
          badge={loading ? copy(locale, "Checking…", "جارٍ الفحص…") : connectivityRow.badge}
          note={copy(
            locale,
            "A network connection is required to load a new page.",
            "يلزم اتصال بالشبكة لتحميل صفحة جديدة.",
          )}
        />
        <StatusRow
          label={copy(locale, "Inspection work protection", "حماية أعمال التفتيش")}
          tone="ok"
          badge={copy(locale, "Drafts and queue preserved", "المسودات وقائمة الانتظار محفوظة")}
          note={copy(
            locale,
            "Already-open inspection work keeps drafts and queued changes on this device; reconnect to synchronize.",
            "تحفظ أعمال التفتيش المفتوحة المسودات والتغييرات في قائمة الانتظار على هذا الجهاز؛ أعد الاتصال للمزامنة.",
          )}
        />
      </div>

      <div className={styles.label} style={{ color: "var(--text-secondary)" }}>{copy(locale, "Storage", "التخزين")}</div>
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
          tone={loading ? "muted" : persistenceRow.tone}
          badge={loading ? "…" : persistenceRow.badge}
          note={copy(
            locale,
            "Persistent browser storage protects offline drafts from eviction under pressure.",
            "يحمي التخزين الدائم في المتصفح المسودات دون اتصال من الحذف عند الضغط.",
          )}
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
          <p className={`t-caption ${styles.note}`} style={{ color: "var(--text-secondary)" }}>
            {copy(
              locale,
              "This screen reads browser state only — it cannot clear drafts, packages, queued work, or conflicts.",
              "تقرأ هذه الشاشة حالة المتصفح فقط — ولا يمكنها مسح المسودات أو الحزم أو الأعمال في قائمة الانتظار أو التعارضات.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
