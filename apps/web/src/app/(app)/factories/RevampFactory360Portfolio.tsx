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
  source_synced_at: string | null;
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

export default function RevampFactory360Portfolio({ factories, crNumber }: {
  factories: RevampFactoryRow[];
  crNumber: string;
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

  return (
    <div className="sq-f360">
      <aside className="sq-f360__portfolio">
        <section className="sq-f360__summary">
          <span>Portfolio · CR {crNumber}</span>
          <div>{summary.map(([value, label, tone]) => (
            <div key={label} data-tone={tone}><strong>{value}</strong><small>{label}</small></div>
          ))}</div>
        </section>
        {factories.map(factory => (
          <button type="button" className="sq-f360__license" key={factory.id}
            aria-pressed={factory.id === selected.id} onClick={() => setSelectedId(factory.id)}>
            <strong>{factory.name}</strong>
            <dl>
              <div><dt>Licence</dt><dd>{factory.license?.license_number ?? "—"}</dd></div>
              <div><dt>Plant</dt><dd>{factory.license?.plant_number ?? "—"}</dd></div>
              <div><dt>Type</dt><dd>{titleCase(factory.license?.license_type ?? factory.activity_class)}</dd></div>
              <div><dt>Stage</dt><dd>{titleCase(factory.license?.stage ?? factory.license?.status ?? null)}</dd></div>
              <div><dt>Compliance</dt><dd>—</dd></div>
              <div><dt>Open violations</dt><dd>—</dd></div>
            </dl>
            <span><em>{titleCase(factory.license?.status ?? null)}</em><em data-risk={factory.risk_band ?? ""}>{titleCase(factory.risk_band)}</em></span>
          </button>
        ))}
      </aside>

      <main className="sq-f360__main">
        <section className="sq-f360__hero">
          <div>
            <h1>{selected.name}</h1>
            <p>{selected.factory_code} · CR {selected.cr_number} · {[selected.region, selected.city].filter(Boolean).join(" / ") || "Location unavailable"}</p>
            <span>Opened from Factory 360</span>
            <span>Reason · portfolio selection</span>
          </div>
          <nav>
            <a href={`/planning/single?cr=${encodeURIComponent(selected.cr_number)}`}>Create inspection</a>
            <a href={`/operations?region=${encodeURIComponent(selected.region ?? "")}`}>View on map</a>
            <a href={selected.dossier_href}>Open full dossier</a>
          </nav>
          <dl>
            <div><dt>Industrial licence</dt><dd>{selected.license?.license_number ?? "—"}</dd></div>
            <div><dt>Plant number</dt><dd>{selected.license?.plant_number ?? "—"}</dd></div>
            <div><dt>Activity</dt><dd>{selected.activity_class ?? "—"}</dd></div>
            <div><dt>Source record</dt><dd>{selected.source_synced_at ? new Date(selected.source_synced_at).toLocaleDateString("en-GB") : "—"}</dd></div>
          </dl>
        </section>

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
            <div><dt>Factory code</dt><dd>{selected.factory_code}</dd></div>
            <div><dt>Commercial registration</dt><dd>{selected.cr_number}</dd></div>
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
          <p>CR {selected.cr_number}</p>
          <p>Licence {selected.license?.license_number ?? "—"}</p>
          <p>Plant {selected.license?.plant_number ?? "—"}</p>
        </section>
        <section>
          <span>Source status & freshness</span>
          <strong>{selected.source_synced_at ? "Source record available" : "Freshness unavailable"}</strong>
          <p>{selected.source_synced_at ? new Date(selected.source_synced_at).toLocaleString("en-GB") : "No recorded synchronization timestamp."}</p>
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
