import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { DistributionStrings } from "@/app/(app)/planning/bulk/DistributionPanels";
import type { LedgerStrings } from "@/app/(app)/planning/bulk/EligibilityLedger";
import type { DistributionHeading } from "./targeting";

export type BulkMessages = ReturnType<typeof bulkMessages>;

export function bulkMessages(locale: Locale) {
  return getMessages(locale).planning.bulk;
}

export function buildScreenStrings(locale: Locale): { title: string; context: string } {
  const bulk = bulkMessages(locale);
  return { title: bulk.title, context: bulk.context };
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
  const { heading, ofDenominator, unknown, riskAdvisory } = bulkMessages(locale).dist;
  return { heading, ofDenominator, unknown, riskAdvisory };
}

export function buildDistributionHeadings(locale: Locale): DistributionHeading[] {
  const { region, risk, activity } = bulkMessages(locale).dist;
  return [
    { key: "region", heading: region },
    { key: "risk_band", heading: risk },
    { key: "activity_class", heading: activity },
  ];
}
