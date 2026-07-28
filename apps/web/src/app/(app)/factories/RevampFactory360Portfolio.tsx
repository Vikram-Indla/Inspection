"use client";

import { useMemo, useState } from "react";

export type RevampFactoryRow = {
  id: string;
  factory_code: string;
  name: string;
  cr_number: string;
  region: string | null;
  city: string | null;
  activity_class: string | null;
  risk_band: string | null;
  risk_score: number | null;
  source: string | null;
  source_synced_at: string | null;
  is_temporary: boolean;
  dossier_href: string;
  license: {
    id: string;
    license_number: string;
    plant_number: string | null;
    license_type: string | null;
    status: string | null;
    stage: string | null;
  } | null;
};

const titleCase = (value: string | null) => value ? value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()) : "—";

export default function RevampFactory360Portfolio({ factories, portfolioLabel, canCreateInspection, locale, provenanceStrings }: {
  factories: RevampFactoryRow[];
  portfolioLabel: string;
  canCreateInspection: boolean;
  locale: "en" | "ar";
  provenanceStrings: {
    registered: string;
    registeredBody: string;
    manual: string;
    manualBody: string;
    unavailable: string;
    unavailableBody: string;
    sourceStatus: string;
    recorded: string;
    freshnessUnavailable: string;
    noSenaeiSync: string;
  };
}) {
  const [selectedId, setSelectedId] = useState(factories[0]?.id ?? "");
  const selected = factories.find(factory => factory.id === selectedId) ?? factories[0];
  const highRisk = factories.filter(factory => factory.risk_band === "high").length;
  const summary = useMemo(() => [
    [String(factories.length), "Factories", ""],
    [String(highRisk), "High risk", highRisk ? "critical" : ""],
    ["—", "Open violations", ""],
    ["—", "Active penalties", ""],
  ], [factories.length, highRisk]);
  if (!selected) return null;
  const condition = selected.risk_band === "high" ? "Critical attention required"
    : selected.risk_band === "medium" ? "Attention required"
      : selected.risk_band === "low" ? "Stable condition" : "Condition unavailable";
  const provenance = selected.is_temporary && selected.source === "immediate_manual"
    ? {
        label: provenanceStrings.manual,
        body: provenanceStrings.manualBody,
        tone: "sq-banner--warning",
        badge: "sq-lozenge--warning",
        recorded: provenanceStrings.noSenaeiSync,
      }
    : !selected.is_temporary && selected.source === "senaei"
      ? {
          label: provenanceStrings.registered,
          body: provenanceStrings.registeredBody,
          tone: "sq-banner--success",
          badge: "sq-lozenge--success",
          recorded: selected.source_synced_at
            ? `${provenanceStrings.recorded} · ${new Date(selected.source_synced_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}`
            : provenanceStrings.freshnessUnavailable,
        }
      : {
          label: provenanceStrings.unavailable,
          body: provenanceStrings.unavailableBody,
          tone: "sq-banner--critical",
          badge: "sq-lozenge--critical",
          recorded: provenanceStrings.freshnessUnavailable,
        };

  return (
    <div className="sq-f360">
      <aside className="sq-f360__portfolio">
        <section className="sq-f360__summary">
          <span>Portfolio · <bdi>{portfolioLabel}</bdi></span>
          <div>{summary.map(([value, label, tone]) => (
            <div key={label} data-tone={tone}><strong>{value}</strong><small>{label}</small></div>
          ))}</div>
        </section>
        {factories.map(factory => (
          <button type="button" className="sq-f360__license" key={factory.id}
            aria-pressed={factory.id === selected.id} onClick={() => setSelectedId(factory.id)}>
            <strong>{factory.name}</strong>
            <dl>
              <div><dt>Licence</dt><dd><bdi>{factory.license?.license_number ?? "—"}</bdi></dd></div>
              <div><dt>Plant</dt><dd><bdi>{factory.license?.plant_number ?? "—"}</bdi></dd></div>
              <div><dt>Type</dt><dd>{titleCase(factory.license?.license_type ?? factory.activity_class)}</dd></div>
              <div><dt>Stage</dt><dd>{titleCase(factory.license?.stage ?? factory.license?.status ?? null)}</dd></div>
              <div><dt>Compliance</dt><dd>—</dd></div>
              <div><dt>Open violations</dt><dd>—</dd></div>
            </dl>
            <span><em>{titleCase(factory.license?.status ?? null)}</em><em data-risk={factory.risk_band ?? ""}>{titleCase(factory.risk_band)}</em></span>
            <span className={`sq-lozenge ${
              factory.is_temporary && factory.source === "immediate_manual"
                ? "sq-lozenge--warning"
                : !factory.is_temporary && factory.source === "senaei"
                  ? "sq-lozenge--success"
                  : "sq-lozenge--critical"
            }`}>
              {factory.is_temporary && factory.source === "immediate_manual"
                ? provenanceStrings.manual
                : !factory.is_temporary && factory.source === "senaei"
                  ? provenanceStrings.registered
                  : provenanceStrings.unavailable}
            </span>
          </button>
        ))}
      </aside>

      <main className="sq-f360__main">
        <section className="sq-f360__hero">
          <div>
            <h1>{selected.name}</h1>
            <p><bdi>{selected.factory_code || "—"}</bdi> · CR <bdi>{selected.cr_number || "—"}</bdi> · {[selected.region, selected.city].filter(Boolean).join(" / ") || "Location unavailable"}</p>
            <span>Opened from Factory 360</span>
            <span>Reason · portfolio selection</span>
          </div>
          <nav>
            {canCreateInspection && !selected.is_temporary && <a href={`/planning/single?cr=${encodeURIComponent(selected.cr_number)}`}>Create inspection</a>}
            <a href={`/operations?region=${encodeURIComponent(selected.region ?? "")}`}>View on map</a>
            <a href={selected.dossier_href}>Open full dossier</a>
          </nav>
          {canCreateInspection && !selected.is_temporary && <p role="status">Inspection submission remains unavailable while DEC-032 is unresolved.</p>}
          <dl>
            <div><dt>Industrial licence</dt><dd><bdi>{selected.license?.license_number ?? "—"}</bdi></dd></div>
            <div><dt>Plant number</dt><dd><bdi>{selected.license?.plant_number ?? "—"}</bdi></dd></div>
            <div><dt>Activity</dt><dd>{selected.activity_class ?? "—"}</dd></div>
            <div><dt>Source record</dt><dd>{provenance.label} · {provenance.recorded}</dd></div>
          </dl>
        </section>

        <div className={`sq-banner ${provenance.tone}`} role="status">
          <div><strong>{provenance.label}</strong> {provenance.body}</div>
        </div>

        <section className="sq-f360__condition">
          <div data-risk={selected.risk_band ?? ""}>
            <span>Overall condition</span>
            <strong>{condition}</strong>
            <p>Based only on the saved governed risk band. Compliance and enforcement are shown separately and are never inferred.</p>
          </div>
          <dl>
            <div><dt>Saved risk</dt><dd>{selected.risk_score ?? "—"}</dd></div>
            <div><dt>Risk band</dt><dd>{titleCase(selected.risk_band)}</dd></div>
            <div><dt>Approved compliance</dt><dd>Not available</dd></div>
            <div><dt>Open violations</dt><dd>Not available</dd></div>
          </dl>
        </section>

        <section className="sq-f360__snapshot">
          <h2>Factory snapshot</h2>
          <dl>
            <div><dt>Factory code</dt><dd><bdi>{selected.factory_code || "—"}</bdi></dd></div>
            <div><dt>Commercial registration</dt><dd><bdi>{selected.cr_number || "—"}</bdi></dd></div>
            <div><dt>Region</dt><dd>{selected.region ?? "—"}</dd></div>
            <div><dt>City</dt><dd>{selected.city ?? "—"}</dd></div>
            <div><dt>Activity</dt><dd>{selected.activity_class ?? "—"}</dd></div>
            <div><dt>Licence state</dt><dd>{titleCase(selected.license?.status ?? null)}</dd></div>
          </dl>
        </section>

        {[
          ["Inspection history", "Approved and submitted inspection records, immutable versions and report outcomes.", selected.dossier_href],
          ["Violations & enforcement", "Violation, corrective-action and penalty records attached to approved inspection evidence.", selected.dossier_href],
          ["Industrial information", "Products, materials, production lines, machinery and source reconciliation.", selected.dossier_href],
          ["Documents & media", "Governed factory documents and official media, separated from inspection evidence.", selected.dossier_href],
        ].map(([title, description, href]) => (
          <details className="sq-f360__section" key={title}>
            <summary><span><strong>{title}</strong><small>{description}</small></span><b>+</b></summary>
            <p>This section is available in the source-backed full dossier.</p>
            <a href={href}>Open {title}</a>
          </details>
        ))}
      </main>

      <aside className="sq-f360__context">
        <section>
          <span>Selected context</span>
          <strong>{selected.name}</strong>
          <p>CR <bdi>{selected.cr_number || "—"}</bdi></p>
          <p>Licence <bdi>{selected.license?.license_number ?? "—"}</bdi></p>
          <p>Plant <bdi>{selected.license?.plant_number ?? "—"}</bdi></p>
        </section>
        <section>
          <span>{provenanceStrings.sourceStatus}</span>
          <strong><span className={`sq-lozenge ${provenance.badge}`}>{provenance.label}</span></strong>
          <p>{provenance.body}</p>
          <p>{provenance.recorded}</p>
        </section>
        <section className="sq-f360__ai">
          <span>Contextual AI</span>
          <strong>Provider output withheld</strong>
          <p>No generated factory claim is shown without an evidence-linked provider response.</p>
          <a href={selected.dossier_href}>Review authoritative evidence</a>
        </section>
      </aside>
    </div>
  );
}
