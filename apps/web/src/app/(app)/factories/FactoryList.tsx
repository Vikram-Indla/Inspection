"use client";
import { useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { IconFactory } from "@/app/icons";
import styles from "./factory-list.module.css";

export type FactoryRow = {
  id: string; factory_code: string; name: string; cr_number: string;
  dossier_href?: string;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  // FNS-103/104 — real registration flag. is_temporary = unregistered/unlicensed
  // establishment created for an immediate visit (0001_foundation L135, M01-045);
  // a licensed/registered factory synced from the national source is is_temporary=false.
  is_temporary: boolean;
};

type LicenseKey = "" | "licensed" | "unlicensed";

// Server-built strings (strings-prop pattern — client components cannot call useT()).
export type FactoryListStrings = {
  regionLabel: string;
  allRegions: string;
  // FNS-107 — city filter alongside region.
  cityLabel: string;         // register: HT-025 "City" (المدينة)
  allCities: string;         // generic connective (mirrors allRegions) — draft
  // FNS-103/104 — licensed/unlicensed segmentation.
  licenseGroupAria: string;  // group a11y label — no register row (draft)
  licenseAll: string;        // generic "All" — draft
  licensed: string;          // register: EM-103 "Licensed"/مرخصة (term); segment-label draft pending review
  unlicensed: string;        // register: EM-002 "Unlicensed Establishments"/غير مرخصة
  of: string;
  factoriesWord: string;
  emptyRegionTitle: string;
  emptyRegionDesc: string;
  thFactory: string;
  thCr: string;
  thRegion: string;
  thCity: string;
  thRisk: string;
  dossier: string;
  portfolioLabel: string;
  licensedCountLabel: string;
  unlicensedCountLabel: string;
  regionsCountLabel: string;
  bandLabels: Record<string, string>;
};

// SCR-WEB-400 / M07-001 — factory registry list with client-side region filter.
export default function FactoryList({ factories, strings }: { factories: FactoryRow[]; strings: FactoryListStrings }) {
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");                       // FNS-107
  const [license, setLicense] = useState<LicenseKey>("");     // FNS-103/104
  const regions = useMemo(
    () => Array.from(new Set(factories.map(f => f.region).filter((r): r is string => !!r))).sort(),
    [factories]);
  const cities = useMemo(
    () => Array.from(new Set(factories.map(f => f.city).filter((c): c is string => !!c))).sort(),
    [factories]);
  const rows = useMemo(() =>
    factories.filter(f =>
      (!region || f.region === region) &&
      (!city || f.city === city) &&
      (license === "" || (license === "unlicensed" ? f.is_temporary : !f.is_temporary))),
    [factories, region, city, license]);
  const licensedCount = factories.filter(factory => !factory.is_temporary).length;
  const riskText = (factory: FactoryRow) => {
    if (!factory.risk_band) return "—";
    const band = strings.bandLabels[factory.risk_band] ?? factory.risk_band;
    return factory.risk_score == null ? band : `${band} · ${factory.risk_score}`;
  };
  const riskTone = (factory: FactoryRow) => factory.risk_band === "high"
    ? "sq-lozenge--critical"
    : factory.risk_band === "medium"
      ? "sq-lozenge--warning"
      : factory.risk_band === "low"
        ? "sq-lozenge--success"
        : "";
  return (
    <>
      <section className={styles.summary} aria-label={strings.portfolioLabel}>
        <dl>
          <div><dt>{strings.factoriesWord}</dt><dd className="sq-numeric">{factories.length}</dd></div>
          <div><dt>{strings.licensedCountLabel}</dt><dd className="sq-numeric">{licensedCount}</dd></div>
          <div><dt>{strings.unlicensedCountLabel}</dt><dd className="sq-numeric">{factories.length - licensedCount}</dd></div>
          <div><dt>{strings.regionsCountLabel}</dt><dd className="sq-numeric">{regions.length}</dd></div>
        </dl>
      </section>
      <div className={styles.filters}>
        {/* FNS-103/104 — licensed/unlicensed segmentation over the real is_temporary flag */}
        <div className="sq-segmented" role="group" aria-label={strings.licenseGroupAria}>
          {([["", strings.licenseAll], ["licensed", strings.licensed], ["unlicensed", strings.unlicensed]] as [LicenseKey, string][]).map(([k, label]) => (
            <button key={k || "all"} type="button" aria-pressed={license === k} onClick={() => setLicense(k)}>{label}</button>
          ))}
        </div>
        <div className="sq-field"><label className="sq-field__label" htmlFor="factory-region-filter">{strings.regionLabel}</label>
          <select id="factory-region-filter" className="sq-select" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">{strings.allRegions}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select></div>
        {/* FNS-107 — city filter (city data already loaded) */}
        <div className="sq-field"><label className="sq-field__label" htmlFor="factory-city-filter">{strings.cityLabel}</label>
          <select id="factory-city-filter" className="sq-select" value={city} onChange={e => setCity(e.target.value)}>
            <option value="">{strings.allCities}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <span className="t-caption"><span className="numeric">{rows.length}</span> {strings.of} <span className="numeric">{factories.length}</span> {strings.factoriesWord}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<IconFactory size={28} />} title={strings.emptyRegionTitle} body={strings.emptyRegionDesc} />
      ) : (
        <div className={styles.cards}>{rows.map(f => (
          <article className={styles.card} key={f.id}>
            <div className={styles.cardHead}>
              <div><h2>{f.name}</h2><p className="sq-caption"><bdi>{f.factory_code}</bdi></p></div>
              <span className={`sq-lozenge ${f.is_temporary ? "sq-lozenge--warning" : "sq-lozenge--success"}`}>{f.is_temporary ? strings.unlicensed : strings.licensed}</span>
            </div>
            <dl>
              <div><dt>{strings.thCr}</dt><dd className="sq-numeric"><bdi>{f.cr_number}</bdi></dd></div>
              <div><dt>{strings.thRegion}</dt><dd>{f.region ?? "—"}</dd></div>
              <div><dt>{strings.thCity}</dt><dd>{f.city ?? "—"}</dd></div>
              <div><dt>{strings.thRisk}</dt><dd><span className={`sq-lozenge ${riskTone(f)}`}>{riskText(f)}</span></dd></div>
            </dl>
            <a
              className="sq-btn sq-btn--secondary"
              href={f.dossier_href ?? `/factories/${f.id}`}
              aria-label={`${strings.dossier}: ${f.name}`}
            >
              {strings.dossier}
            </a>
          </article>
        ))}</div>
      )}
    </>
  );
}
