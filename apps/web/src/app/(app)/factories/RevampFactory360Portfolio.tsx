"use client";

import { useState } from "react";
import FactoriesPortfolio from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import {
  titleCase,
  toLicence,
  type FactoryRow,
  type ProvenanceStrings,
} from "@/features/factories/portfolio";
import { getMessages } from "@/i18n/messages";

export type RevampFactoryRow = FactoryRow;

function planningHandoffHref(factory: FactoryRow): string {
  const query = new URLSearchParams({ factory: factory.id, source: "factory360" });
  if (factory.cr_number) query.set("cr", factory.cr_number);
  if (factory.license?.license_number) query.set("license", factory.license.license_number);
  if (factory.license?.plant_number) query.set("plant", factory.license.plant_number);
  return `/planning/single?${query.toString()}`;
}

export default function RevampFactory360Portfolio({ factories, portfolioLabel, canCreateInspection, locale, provenanceStrings }: {
  factories: FactoryRow[];
  portfolioLabel: string;
  canCreateInspection: boolean;
  locale: "en" | "ar";
  provenanceStrings: ProvenanceStrings;
}) {
  const { factories: copy } = getMessages(locale);
  const [selectedId, setSelectedId] = useState(factories[0]?.id ?? "");
  const selected = factories.find(factory => factory.id === selectedId) ?? factories[0];
  const highRisk = factories.filter(factory => factory.risk_band === "high").length;
  const licences = factories.map(factory => toLicence(factory, provenanceStrings));
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
    : selected.source === "saqeel_test_data"
      ? {
          label: provenanceStrings.test,
          body: provenanceStrings.testBody,
          tone: "sq-banner--warning",
          badge: "sq-lozenge--warning",
          recorded: provenanceStrings.noSenaeiSync,
        }
      : {
          label: provenanceStrings.unavailable,
          body: provenanceStrings.unavailableBody,
          tone: "sq-banner--critical",
          badge: "sq-lozenge--critical",
          recorded: provenanceStrings.freshnessUnavailable,
        };

  return (
    <FactoryWorkspace
      startLabel={copy.workspace.portfolio}
      endLabel={copy.workspace.context}
      start={
        <FactoriesPortfolio
          portfolioLabel={portfolioLabel}
          licences={licences}
          selectedId={selected.id}
          onSelect={setSelectedId}
          highRiskCount={highRisk}
          strings={{
            allLicences: copy.portfolio.allLicences,
            factories: copy.portfolio.factories,
            highRisk: copy.portfolio.highRisk,
            licenceNumber: copy.portfolio.licenceNumber,
            plantNumber: copy.portfolio.plantNumber,
            type: copy.portfolio.type,
            stage: copy.portfolio.stage,
            licenceStatus: copy.portfolio.licenceStatus,
            risk: copy.portfolio.risk,
            compliance: copy.portfolio.compliance,
            openViolations: copy.portfolio.openViolations,
            notAvailable: copy.portfolio.notAvailable,
            missing: copy.portfolio.missing,
            riskHigh: copy.risk.high,
            riskMedium: copy.risk.medium,
            riskLow: copy.risk.low,
          }}
        />
      }
      end={
        <div className="sq-f360__context">
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
        </div>
      }
    >
        <section className="sq-f360__hero" data-screen-id="F360-S02">
          <div>
            <h1>{selected.name}</h1>
            <p><bdi>{selected.factory_code || "—"}</bdi> · CR <bdi>{selected.cr_number || "—"}</bdi> · {[selected.region, selected.city].filter(Boolean).join(" / ") || "Location unavailable"}</p>
            <span>Opened from Factory 360</span>
            <span>Reason · selected from list</span>
          </div>
          <nav>
            {canCreateInspection && !selected.is_temporary && <a href={planningHandoffHref(selected)}>Create inspection</a>}
            <a href={`/operations?region=${encodeURIComponent(selected.region ?? "")}`}>View on map</a>
            <a href={selected.dossier_href}>Open full profile</a>
          </nav>
          {canCreateInspection && !selected.is_temporary && <p role="status">A Planner submits the selected target for Supervisor assignment and release.</p>}
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
            <p>This section is available in the full factory profile.</p>
            <a href={href}>Open {title}</a>
          </details>
        ))}
    </FactoryWorkspace>
  );
}
