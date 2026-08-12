import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { DistributionStrings } from "@/app/(app)/planning/bulk/DistributionPanels";
import type { LedgerStrings } from "@/app/(app)/planning/bulk/EligibilityLedger";
import type { DistributionHeading } from "./targeting";

export type BulkMessages = ReturnType<typeof bulkMessages>;

export function bulkMessages(locale: Locale) {
  return getMessages(locale).planning.bulk;
}

const SEPARATORS = /[_-]+/g;

export function buildValueLabel(locale: Locale): (value: string) => string {
  const governed: Record<string, string> = bulkMessages(locale).enumLabel;
  return value => governed[value]
    ?? value.replace(SEPARATORS, " ").replace(/^./, first => first.toLocaleUpperCase(locale));
}

export function buildBoundaryStrings(locale: Locale) {
  const bulk = bulkMessages(locale);
  return {
    title: bulk.boundaryTitle,
    body: bulk.boundaryBody,
    retryLabel: bulk.boundaryRetry,
    referenceLabel: bulk.boundaryReference,
  };
}

export function buildScreenStrings(locale: Locale): { title: string } {
  return { title: bulkMessages(locale).title };
}

export function buildAccessStrings(locale: Locale): BulkMessages["access"] {
  return bulkMessages(locale).access;
}

export function buildNoticeStrings(locale: Locale): BulkMessages["notice"] {
  return bulkMessages(locale).notice;
}

export function buildAdvisoryStrings(locale: Locale): BulkMessages["ai"] {
  return bulkMessages(locale).ai;
}

export function buildLedgerStrings(locale: Locale): LedgerStrings {
  return bulkMessages(locale).ledger;
}

export function buildDistributionStrings(locale: Locale): DistributionStrings {
  const { heading, ofDenominator, unknown } = bulkMessages(locale).dist;
  return { heading, ofDenominator, unknown };
}

export function buildDistributionHeadings(locale: Locale): DistributionHeading[] {
  const { region, risk, activity } = bulkMessages(locale).dist;
  return [
    { key: "region", heading: region },
    { key: "risk_band", heading: risk },
    { key: "activity_class", heading: activity },
  ];
}
