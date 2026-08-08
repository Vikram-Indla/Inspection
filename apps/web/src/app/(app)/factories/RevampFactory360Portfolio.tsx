"use client";

import { useState } from "react";
import FactoriesPortfolio from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import FactoryContext from "@/components/sections/factories/factory-context/factory-context";
import FactoryOverview from "@/components/sections/factories/factory-overview/factory-overview";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import {
  conditionOf,
  provenanceDetail,
  toLicence,
  type FactoryRow,
  type ProvenanceStrings,
} from "@/features/factories/portfolio";
import { fill, getMessages } from "@/i18n/messages";

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
