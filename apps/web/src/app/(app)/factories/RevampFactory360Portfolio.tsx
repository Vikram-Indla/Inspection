"use client";

import { useState } from "react";
import FactoriesPortfolio from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import FactoryContext from "@/components/sections/factories/factory-context/factory-context";
import FactoryOverview from "@/components/sections/factories/factory-overview/factory-overview";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import {
  conditionOf,
  provenanceDetail,
  provenanceOf,
  toLicence,
  type FactoryRow,
  type ProvenanceStrings,
} from "@/features/factories/portfolio";
import type { PortfolioCounts } from "@/features/factories/portfolio-counts";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { formatDate } from "@/lib/dates";
import { fill, getMessages } from "@/i18n/messages";

export type RevampFactoryRow = FactoryRow;

const alertTone = (value: number | null, raised: StatusTone): StatusTone =>
  (value === null || value === 0 ? "neutral" : raised);

function planningHandoffHref(factory: FactoryRow): string {
  const query = new URLSearchParams({ factory: factory.id, source: "factory360" });
  if (factory.cr_number) query.set("cr", factory.cr_number);
  if (factory.license?.license_number) query.set("license", factory.license.license_number);
  if (factory.license?.plant_number) query.set("plant", factory.license.plant_number);
  return `/planning/single?${query.toString()}`;
}

export default function RevampFactory360Portfolio({ factories, portfolioLabel, canCreateInspection, locale, provenanceStrings, counts, now }: {
  factories: FactoryRow[];
  portfolioLabel: string;
  canCreateInspection: boolean;
  locale: "en" | "ar";
  provenanceStrings: ProvenanceStrings;
  counts: PortfolioCounts;
  now: number;
}) {
  const { factories: copy } = getMessages(locale);
  const [selectedId, setSelectedId] = useState(factories[0]?.id ?? "");
  const selected = factories.find(factory => factory.id === selectedId) ?? factories[0];
  const highRisk = factories.filter(factory => factory.risk_band === "high").length;
  const licences = factories.map(factory => toLicence(factory, provenanceStrings, {
    openViolations: counts.openViolationsAvailable ? counts.openViolations.get(factory.id) ?? 0 : null,
    now,
  }));
  const sum = (values: ReadonlyMap<string, number>) =>
    factories.reduce((total, factory) => total + (values.get(factory.id) ?? 0), 0);
  const totalOpenViolations = sum(counts.openViolations);
  const totalActivePenalties = sum(counts.activePenalties);
  const provenanceNotice = factories
    .map(factory => provenanceOf(factory, provenanceStrings))
    .find(entry => entry.tone !== "success") ?? null;
  if (!selected) return null;

  const condition = conditionOf(selected.risk_band, {
    critical: copy.condition.critical,
    attention: copy.condition.attention,
    stable: copy.condition.stable,
    unavailable: copy.condition.unavailable,
  });
  const provenance = provenanceDetail(selected, provenanceStrings, locale);
  const createHref = canCreateInspection && !selected.is_temporary ? planningHandoffHref(selected) : null;
  const contextStrings = {
    selectedContext: copy.workspace.context,
    cr: copy.snapshot.commercialRegistration,
    licence: copy.hero.industrialLicence,
    plant: copy.portfolio.plantNumber,
    sourceStatus: provenanceStrings.sourceStatus,
    aiTitle: copy.ai.title,
    aiWithheld: copy.ai.withheld,
    aiBody: copy.ai.body,
    aiAction: copy.ai.action,
    missing: copy.portfolio.missing,
  };
  const sections = [
    { key: "inspectionHistory", ...copy.sections.items.inspectionHistory },
    { key: "violations", ...copy.sections.items.violations },
    { key: "industrial", ...copy.sections.items.industrial },
    { key: "documents", ...copy.sections.items.documents },
  ].map(item => ({
    key: item.key,
    title: item.title,
    body: item.body,
    openLabel: fill(copy.sections.open, { title: item.title }),
    href: selected.dossier_href,
  }));
  const overviewStrings = {
    opened: copy.hero.opened,
    plannerNote: copy.hero.plannerNote,
    industrialLicence: copy.hero.industrialLicence,
    plantNumber: copy.portfolio.plantNumber,
    activity: copy.hero.activity,
    sourceRecord: copy.hero.sourceRecord,
    createInspection: copy.action.createInspection,
    viewOnMap: copy.action.viewOnMap,
    openProfile: copy.action.openProfile,
    conditionTitle: copy.condition.title,
    conditionBasis: copy.condition.basis,
    savedRisk: copy.condition.savedRisk,
    riskBand: copy.condition.riskBand,
    approvedCompliance: copy.condition.approvedCompliance,
    openViolations: copy.portfolio.openViolations,
    notAvailable: copy.portfolio.notAvailable,
    missing: copy.portfolio.missing,
    snapshotTitle: copy.snapshot.title,
    factoryCode: copy.snapshot.factoryCode,
    commercialRegistration: copy.snapshot.commercialRegistration,
    region: copy.snapshot.region,
    city: copy.snapshot.city,
    licenceState: copy.snapshot.licenceState,
    sectionAvailable: copy.sections.availableInProfile,
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
          stats={[
            { key: "factories", label: copy.portfolio.factories, value: factories.length, tone: "neutral" },
            { key: "highRisk", label: copy.portfolio.highRisk, value: highRisk, tone: alertTone(highRisk, "danger") },
            {
              key: "openViolations",
              label: copy.portfolio.openViolations,
              value: counts.openViolationsAvailable ? totalOpenViolations : null,
              tone: alertTone(counts.openViolationsAvailable ? totalOpenViolations : null, "danger"),
            },
            {
              key: "activePenalties",
              label: copy.portfolio.activePenalties,
              value: counts.activePenaltiesAvailable ? totalActivePenalties : null,
              tone: alertTone(counts.activePenaltiesAvailable ? totalActivePenalties : null, "warning"),
            },
          ]}
          provenanceNotice={provenanceNotice}
          formatDate={iso => formatDate(iso, locale)}
          strings={{
            portfolio: copy.portfolio.portfolio,
            factories: copy.portfolio.factories,
            highRisk: copy.portfolio.highRisk,
            openViolations: copy.portfolio.openViolations,
            activePenalties: copy.portfolio.activePenalties,
            licenceNumber: copy.portfolio.licenceNumber,
            plantNumber: copy.portfolio.plantNumber,
            type: copy.portfolio.type,
            stage: copy.portfolio.stage,
            expiry: copy.portfolio.expiry,
            notAvailable: copy.portfolio.notAvailable,
            missing: copy.portfolio.missing,
            riskHigh: copy.risk.high,
            riskMedium: copy.risk.medium,
            riskLow: copy.risk.low,
            expired: copy.portfolio.expired,
            expiringSoon: copy.portfolio.expiringSoon,
          }}
        />
      }
      end={<FactoryContext factory={selected} provenance={provenance} strings={contextStrings} />}
    >
      <FactoryOverview
        factory={selected}
        condition={condition}
        provenance={provenance}
        sections={sections}
        createHref={createHref}
        mapHref={`/operations?region=${encodeURIComponent(selected.region ?? "")}`}
        profileHref={selected.dossier_href}
        strings={overviewStrings}
      />
    </FactoryWorkspace>
  );
}
