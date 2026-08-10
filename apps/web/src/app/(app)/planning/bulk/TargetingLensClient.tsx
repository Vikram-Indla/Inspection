"use client";
// CD-021 (SCR-WEB-110) — "Focus condition" coordinator (design frame 1a).
// Focusing a criteria chip reveals its population contribution in the ledger,
// the matching distribution bucket and the matching evidence-table rows, all
// from data already fetched server-side — no new server action, pure client
// presentation, as the design package itself specifies.
import { useState } from "react";
import CriteriaBuilder, { type CriteriaBuilderStrings, type BuilderField } from "./CriteriaBuilder";
import EligibilityLedger, { type LedgerStrings } from "./EligibilityLedger";
import DistributionPanels, { type Distribution, type DistributionStrings } from "./DistributionPanels";
import BulkForm, { type BulkFormStrings } from "./BulkForm";
import type { GroupNode } from "./criteria";
import { serializeCriteria } from "./criteria";
import type { Locale } from "@/lib/i18n";

type LeafInfo = { pathKey: string; field: string; value: string };

export default function TargetingLensClient({
  initialTree, fieldOptions, matchCount, criteriaStrings, contributions, leafInfo,
  denominator, eligible, oldestSyncedAt, missingSync, ledgerStrings,
  distributions, distStrings,
  factories, bulkFormStrings, locale, builderFields, cityByRegion,
}: {
  initialTree: GroupNode;
  fieldOptions: Record<string, string[]>;
  matchCount: number;
  criteriaStrings: CriteriaBuilderStrings;
  contributions: Record<string, number>;
  leafInfo: LeafInfo[];
  denominator: number;
  eligible: number;
  oldestSyncedAt: string | null;
  missingSync: number;
  ledgerStrings: LedgerStrings;
  distributions: Distribution[];
  distStrings: DistributionStrings;
  factories: never;
  bulkFormStrings: BulkFormStrings;
  locale: Locale;
  builderFields: BuilderField[];
  cityByRegion: Record<string, string[]>;
}) {
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const focusedLeaf = focusedPath ? leafInfo.find(l => l.pathKey === focusedPath) ?? null : null;
  const focusedCount = focusedLeaf ? contributions[focusedLeaf.pathKey] ?? null : null;

  return (
    <>
      <CriteriaBuilder initialTree={initialTree} fieldOptions={fieldOptions} matchCount={matchCount} strings={criteriaStrings}
        contributions={contributions} focusedPath={focusedPath} onFocus={setFocusedPath}
        builderFields={builderFields} cityByRegion={cityByRegion} locale={locale} />
      <EligibilityLedger denominator={denominator} eligible={eligible} oldestSyncedAt={oldestSyncedAt} missingSync={missingSync}
        strings={ledgerStrings} focusedCount={focusedCount} focusedLabel={focusedLeaf ? `${focusedLeaf.field}: ${focusedLeaf.value}` : null} locale={locale} />
      <DistributionPanels distributions={distributions} strings={distStrings}
        focusedField={focusedLeaf?.field} focusedValue={focusedLeaf?.value} />
      <BulkForm factories={factories} strings={bulkFormStrings}
        focusedField={focusedLeaf?.field} focusedValue={focusedLeaf?.value} locale={locale}
        criteriaTree={serializeCriteria(initialTree)} />
    </>
  );
}
