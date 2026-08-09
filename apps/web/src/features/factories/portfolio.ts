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
  risk_version: string | null;
  risk_drivers: unknown;
  risk_calculated_at: string | null;
  employees_total: number | null;
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
    expiry_date: string | null;
  } | null;
};

/**
 * Working threshold for the "expiring soon" licence pill, agreed with the owner
 * on 2026-08-09. It is a display rule only — no planning, enforcement or
 * licensing decision reads it. Replace with the governed value when product
 * rules one.
 */
export const LICENCE_EXPIRY_SOON_DAYS = 30;

export type LicenceExpiryState = "expired" | "expiringSoon" | "valid";

export function licenceExpiryState(expiry: string | null, now: number): LicenceExpiryState | null {
  if (!expiry) return null;
  const due = new Date(expiry).getTime();
  if (Number.isNaN(due)) return null;
  const days = Math.floor((due - now) / 86_400_000);
  if (days < 0) return "expired";
  return days <= LICENCE_EXPIRY_SOON_DAYS ? "expiringSoon" : "valid";
}

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

export type ConditionStrings = {
  critical: string;
  attention: string;
  stable: string;
  unavailable: string;
};

export function titleCase(value: string | null): string {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function humanised(value: string | null | undefined): string | null {
  return value ? titleCase(value) : null;
}

/**
 * Seeded/demo records identified by their recorded source. This is the second
 * of two independent test filters and they catch different things:
 * `isTestFixtureEstablishment` matches e2e fixtures by name and factory code,
 * while this matches anything the source system itself marks as test data.
 * Neither may reach a customer-facing surface.
 */
export function isTestSourceFactory(factory: { source: string | null }): boolean {
  return factory.source === "saqeel_test_data" || (factory.source?.includes("test") ?? false);
}

export function provenanceOf(factory: FactoryRow, strings: ProvenanceStrings): {
  label: string;
  tone: StatusTone;
} {
  if (factory.is_temporary && factory.source === "immediate_manual") {
    return { label: strings.manual, tone: "warning" };
  }
  if (factory.source === "saqeel_test_data" || (factory.source?.includes("test") ?? false)) {
    return { label: strings.test, tone: "warning" };
  }
  if (!factory.is_temporary && factory.source === "senaei") {
    return { label: strings.registered, tone: "success" };
  }
  return { label: strings.unavailable, tone: "danger" };
}

export function provenanceDetail(factory: FactoryRow, strings: ProvenanceStrings, locale: "en" | "ar"): {
  label: string;
  tone: StatusTone;
  body: string;
  recorded: string;
} {
  const base = provenanceOf(factory, strings);
  if (base.tone === "success") {
    return {
      ...base,
      body: strings.registeredBody,
      recorded: factory.source_synced_at
        ? `${strings.recorded} · ${new Date(factory.source_synced_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}`
        : strings.freshnessUnavailable,
    };
  }
  if (base.label === strings.manual) {
    return { ...base, body: strings.manualBody, recorded: strings.noSenaeiSync };
  }
  if (base.label === strings.test) {
    return { ...base, body: strings.testBody, recorded: strings.noSenaeiSync };
  }
  return { ...base, body: strings.unavailableBody, recorded: strings.freshnessUnavailable };
}

export function conditionOf(band: string | null, strings: ConditionStrings): {
  label: string;
  tone: StatusTone;
} {
  if (band === "high") return { label: strings.critical, tone: "danger" };
  if (band === "medium") return { label: strings.attention, tone: "warning" };
  if (band === "low") return { label: strings.stable, tone: "success" };
  return { label: strings.unavailable, tone: "neutral" };
}

export function toLicence(factory: FactoryRow, strings: ProvenanceStrings, counts: {
  openViolations: number | null;
  now: number;
}): PortfolioLicence {
  const provenance = provenanceOf(factory, strings);
  const expiry = factory.license?.expiry_date ?? null;
  return {
    id: factory.id,
    name: factory.name,
    licenceNumber: factory.license?.license_number ?? null,
    plantNumber: factory.license?.plant_number ?? null,
    type: humanised(factory.license?.license_type ?? factory.activity_class),
    stage: humanised(factory.license?.stage ?? factory.license?.status),
    licenceStatus: humanised(factory.license?.status),
    riskBand: factory.risk_band,
    expiryDate: expiry,
    expiryState: licenceExpiryState(expiry, counts.now),
    openViolations: counts.openViolations,
    provenanceLabel: provenance.label,
    provenanceTone: provenance.tone,
  };
}
