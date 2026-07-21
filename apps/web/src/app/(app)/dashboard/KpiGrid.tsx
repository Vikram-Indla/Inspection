"use client";

import { useState } from "react";

export type Methodology = {
  id: string;
  label: string;
  q: string;
  value: string;
  num: string;
  den: string;
  excl: string;
  time: string;
  formulaV: string;
  policyV: string;
  fresh: string;
  drill: string;
  drillHref?: string;
};

export type Kpi = {
  key: string;
  label: string;
  /** Primary numeric value. Omitted when `badge` renders a governed state instead. */
  value?: string;
  unit?: string;
  /** Governed status token colour for the value, e.g. "critical" | "warning". */
  valueTone?: "critical" | "warning";
  /** Governed "Not configured / Not available" pill instead of a fabricated number. */
  badge?: { text: string; tone: string };
  /** Tinted trend chip (real delta only — never fabricated). */
  deltaChip?: { text: string; dir?: "up" | "down" };
  /** Meta line under the value. */
  deltaText?: string;
  method?: Methodology;
};

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" />
  </svg>
);

export default function KpiGrid({ kpis, locale, methodologyLabel }: {
  kpis: Kpi[];
  locale: "en" | "ar";
  methodologyLabel: string;
}) {
  const [open, setOpen] = useState<Methodology | null>(null);
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const terms: [string, keyof Methodology][] = [
    [t("Business question", "السؤال التجاري"), "q"],
    [t("Value", "القيمة"), "value"],
    [t("Numerator", "البسط"), "num"],
    [t("Denominator", "المقام"), "den"],
    [t("Exclusions", "الاستثناءات"), "excl"],
    [t("Time basis", "الأساس الزمني"), "time"],
    [t("Formula version", "إصدار المعادلة"), "formulaV"],
    [t("Policy version", "إصدار السياسة"), "policyV"],
    [t("Source freshness", "حداثة المصدر"), "fresh"],
    [t("Drill route", "مسار التنقل"), "drill"],
  ];
  const mono = new Set<keyof Methodology>(["formulaV", "policyV"]);

  return (
    <>
      <div className="kpi-grid">
        {kpis.map(kpi => (
          <div className="kpi" key={kpi.key}>
            {kpi.method && (
              <button className="kpi-info" type="button" aria-label={methodologyLabel}
                onClick={() => setOpen(kpi.method!)}>
                <InfoIcon />
              </button>
            )}
            <div className="kpi-label">{kpi.label}</div>
            {kpi.badge
              ? <div style={{ marginBlock: "2px" }}><span className={`badge ${kpi.badge.tone}`}><span className="dot" />{kpi.badge.text}</span></div>
              : <div className="kpi-value" style={kpi.valueTone ? { color: `var(--status-${kpi.valueTone})` } : undefined}>
                  {kpi.value}{kpi.unit && <span className="unit">{kpi.unit}</span>}
                </div>}
            <div className="kpi-delta">
              {kpi.deltaChip && <span className={`delta${kpi.deltaChip.dir ? ` ${kpi.deltaChip.dir}` : ""}`}>{kpi.deltaChip.text}</span>}
              {kpi.deltaText}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(null)} aria-hidden="true"
            style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", zIndex: 40 }} />
          <div className="drawer" role="dialog" aria-label={open.label} style={{ zIndex: 41 }}>
            <div className="drawer-header">
              <div>
                <div className="panel-title" style={{ fontSize: "15px" }}>{open.label}</div>
                <div className="id-code" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{open.id}</div>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" type="button" onClick={() => setOpen(null)} aria-label={t("Close", "إغلاق")}>✕</button>
            </div>
            <div className="drawer-body">
              <dl className="desc" style={{ gridTemplateColumns: "auto 1fr", gap: "8px 14px" }}>
                {terms.map(([label, field]) => (
                  <div key={field} style={{ display: "contents" }}>
                    <dt>{label}</dt>
                    <dd>{mono.has(field)
                      ? <span className="id-code">{open[field]}</span>
                      : field === "drill" && open.drillHref
                        ? <a href={open.drillHref}>{open.drill}</a>
                        : open[field]}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {open.drillHref && (
              <div style={{ padding: "16px", borderBlockStart: "1px solid var(--border-subtle)" }}>
                <a className="btn btn-secondary btn-block" href={open.drillHref}>{t("Open records", "فتح السجلات")}</a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
