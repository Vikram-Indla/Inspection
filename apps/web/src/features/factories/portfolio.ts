import type { PortfolioLicence } from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type FactoryRow = {
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

export type ProvenanceStrings = {
  registered: string;
  registeredBody: string;
  manual: string;
  manualBody: string;
  test: string;
  testBody: string;
  unavailable: string;
  unavailableBody: string;
  sourceStatus: string;
  recorded: string;
  freshnessUnavailable: string;
  noSenaeiSync: string;
};

export function titleCase(value: string | null): string {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function humanised(value: string | null | undefined): string | null {
  return value ? titleCase(value) : null;
}

export function provenanceOf(factory: FactoryRow, strings: ProvenanceStrings): {
  label: string;
  tone: StatusTone;
} {
  if (factory.is_temporary && factory.source === "immediate_manual") {
    return { label: strings.manual, tone: "warning" };
  }
  if (factory.source === "saqeel_test_data") {
    return { label: strings.test, tone: "warning" };
  }
  if (!factory.is_temporary && factory.source === "senaei") {
    return { label: strings.registered, tone: "success" };
  }
  return { label: strings.unavailable, tone: "danger" };
}

export function toLicence(factory: FactoryRow, strings: ProvenanceStrings): PortfolioLicence {
  const provenance = provenanceOf(factory, strings);
  return {
    id: factory.id,
    name: factory.name,
    licenceNumber: factory.license?.license_number ?? null,
    plantNumber: factory.license?.plant_number ?? null,
    type: humanised(factory.license?.license_type ?? factory.activity_class),
    stage: humanised(factory.license?.stage ?? factory.license?.status),
    licenceStatus: humanised(factory.license?.status),
    riskBand: factory.risk_band,
    provenanceLabel: provenance.label,
    provenanceTone: provenance.tone,
  };
}
