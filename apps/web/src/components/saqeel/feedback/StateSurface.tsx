import React from "react";
import { Skeleton } from "./Skeleton";

export type StateSurfaceKind =
  | "empty"
  | "loading"
  | "error"
  | "rls-denied"
  | "not-yet"
  | "provider-unavailable"
  | "degraded"
  | "stale"
  | "conflict"
  | "unauthorized";

type Locale = "en" | "ar";

const copy: Record<Locale, Record<StateSurfaceKind, { title: string; body: string }>> = {
  en: {
    empty: {
      title: "No records",
      body: "No records are visible in your scope.",
    },
    loading: {
      title: "Loading",
      body: "Loading governed data within your access scope.",
    },
    error: {
      title: "Couldn’t load. Nothing was changed.",
      body: "The requested data is temporarily unavailable. Nothing was changed. Try again.",
    },
    "rls-denied": {
      title: "Nothing in your scope",
      body: "This view may be empty because access policy restricts rows to your authority — not a claim that no data exists.",
    },
    "not-yet": {
      title: "Not available",
      body: "This capability is off by default. When enabled it remains governed and requires human disposition.",
    },
    "provider-unavailable": {
      title: "Service unavailable",
      body: "The provider is not configured or could not be reached. No fallback result has been presented as production truth.",
    },
    degraded: {
      title: "Limited information",
      body: "Only verified available information is shown. Missing information has not been inferred.",
    },
    stale: {
      title: "Information changed",
      body: "Refresh the governed record before continuing. Your pending change has not been applied.",
    },
    conflict: {
      title: "Review the latest version",
      body: "The server version changed. Nothing was overwritten; compare the latest record before retrying.",
    },
    unauthorized: {
      title: "Access not available",
      body: "Your current role and scope do not permit this view. Navigation visibility does not replace authorization.",
    },
  },
  ar: {
    empty: {
      title: "لا توجد سجلات",
      body: "اكتملت القراءة المحكومة ولم تُرجع سجلات مرئية.",
    },
    loading: {
      title: "جارٍ التحميل",
      body: "جارٍ تحميل البيانات المحكومة ضمن نطاق صلاحياتك.",
    },
    error: {
      title: "البيانات المطلوبة غير متاحة مؤقتاً.",
      body: "البيانات المطلوبة غير متاحة مؤقتاً. لم يتغيّر أي شيء. حاول مرة أخرى.",
    },
    "rls-denied": {
      title: "لا توجد سجلات ضمن نطاقك",
      body: "قد يكون هذا العرض فارغاً لأن سياسات الوصول تحصر الصفوف على صلاحيتك — وليس تأكيداً على عدم وجود بيانات.",
    },
    "not-yet": {
      title: "غير متاح بعد",
      body: "هذه الميزة معطّلة افتراضياً؛ وعند تفعيلها تظل خاضعة للحوكمة والتحقق البشري.",
    },
    "provider-unavailable": {
      title: "الخدمة غير متاحة",
      body: "المزوّد غير مهيأ أو تعذر الوصول إليه. لم تُعرض نتيجة بديلة على أنها حقيقة إنتاجية.",
    },
    degraded: {
      title: "معلومات محدودة",
      body: "تُعرض المعلومات المتاحة التي تم التحقق منها فقط، ولم يتم استنتاج المعلومات الناقصة.",
    },
    stale: {
      title: "تغيّرت المعلومات",
      body: "حدّث السجل المحكوم قبل المتابعة. لم يتم تطبيق التغيير المعلّق.",
    },
    conflict: {
      title: "راجع أحدث إصدار",
      body: "تغيّر إصدار الخادم. لم تتم الكتابة فوق أي بيانات؛ قارن أحدث سجل قبل إعادة المحاولة.",
    },
    unauthorized: {
      title: "الوصول غير متاح",
      body: "دورك ونطاقك الحاليان لا يسمحان بهذا العرض. ظهور التنقل لا يحل محل التفويض.",
    },
  },
};

function StateGlyph({ kind }: { kind: StateSurfaceKind }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "rls-denied" || kind === "unauthorized") {
    return <svg {...common}><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
  }
  if (kind === "error" || kind === "conflict" || kind === "stale") {
    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>;
  }
  if (kind === "provider-unavailable" || kind === "degraded" || kind === "not-yet") {
    return <svg {...common}><path d="M4 18h16M6 15l3-4 3 2 4-6 2 3"/><path d="M18 5v5h-5"/></svg>;
  }
  return <svg {...common}><path d="M3 7h6l2 3h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
}

export interface StateSurfaceProps {
  kind: StateSurfaceKind;
  locale?: Locale;
  title?: string;
  body?: string;
  action?: React.ReactNode;
  /** Optional governed seam identifier; shown only for an intentionally unavailable capability. */
  seam?: string;
  className?: string;
}

export function StateSurface({
  kind,
  locale = "en",
  title,
  body,
  action,
  seam,
  className,
}: StateSurfaceProps) {
  const message = copy[locale][kind];
  if (kind === "loading") {
    return (
      <section
        className={["saqeel-state", "saqeel-state--loading", className].filter(Boolean).join(" ")}
        aria-busy="true"
        aria-label={title ?? message.title}
        data-state-kind={kind}
      >
        <Skeleton width="38%" height={22} />
        <div className="saqeel-state__skeletons" aria-hidden="true">
          <Skeleton height={28} /><Skeleton height={28} /><Skeleton height={28} /><Skeleton width="72%" height={28} />
        </div>
        <p className="t-caption">{body ?? message.body}</p>
      </section>
    );
  }

  const urgent = kind === "error" || kind === "conflict" || kind === "stale";
  return (
    <section
      className={["saqeel-state", `saqeel-state--${kind}`, className].filter(Boolean).join(" ")}
      role={urgent ? "alert" : "status"}
      data-state-kind={kind}
    >
      <span className="saqeel-state__glyph"><StateGlyph kind={kind} /></span>
      <div className="saqeel-state__content">
        {kind === "not-yet" ? <span className="badge badge-pending"><span className="dot" />{message.title}</span> : null}
        <h2>{title ?? message.title}</h2>
        <p>{body ?? message.body}</p>
        {action ? <div className="saqeel-state__action">{action}</div> : null}
        {kind === "not-yet" && seam ? <code className="id-code">seam: {seam}</code> : null}
      </div>
    </section>
  );
}

export const STATE_SURFACE_KINDS: readonly StateSurfaceKind[] = [
  "empty", "loading", "error", "rls-denied", "not-yet",
  "provider-unavailable", "degraded", "stale", "conflict", "unauthorized",
];
