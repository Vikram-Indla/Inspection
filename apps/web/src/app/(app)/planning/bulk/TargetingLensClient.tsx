"use client";

import { useState } from "react";
import CriteriaBuilder, { type CriteriaBuilderStrings, type BuilderField } from "./CriteriaBuilder";
import EligibilityLedger, { type LedgerStrings } from "./EligibilityLedger";
import DistributionPanels, { type Distribution, type DistributionStrings } from "./DistributionPanels";
import BulkForm, { type BulkFormStrings } from "./BulkForm";
import type { GroupNode } from "./criteria";
import { serializeCriteria } from "./criteria";
import type { Locale } from "@/lib/i18n";
import type { CriteriaFactory } from "@/features/planning-bulk/view";
import type { CriteriaLeaf } from "@/features/planning-bulk/targeting";

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
  leafInfo: CriteriaLeaf[];
  denominator: number;
  eligible: number;
  oldestSyncedAt: string | null;
  missingSync: number;
  ledgerStrings: LedgerStrings;
  distributions: Distribution[];
  distStrings: DistributionStrings;
  factories: CriteriaFactory[];
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
