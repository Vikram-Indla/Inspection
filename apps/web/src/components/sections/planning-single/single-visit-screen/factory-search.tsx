"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import FactoryResults from "@/components/sections/planning-single/factory-results/factory-results";
import IdentityDossier from "@/components/sections/planning-single/identity-dossier/identity-dossier";
import type { GradedFactory } from "@/features/planning-single/shapes";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import type { Locale } from "@/lib/i18n";

export default function FactorySearch({
  query, results, registryUnavailable, settled, matchedElsewhere, selectedId,
  onQueryChange, onSelect, onRetry, strings, locale,
}: {
  query: string;
  results: readonly GradedFactory[];
  registryUnavailable: boolean;
  settled: boolean;
  matchedElsewhere: boolean;
  selectedId: string | null;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  strings: SingleVisitStrings;
  locale: Locale;
}) {
  return (
    <Card as="section" labelledBy="single-visit-search">
      <CardHeader
        level="h2"
        titleId="single-visit-search"
        eyebrow={strings.stepLabels.find}
        title={strings.findFactory}
      />
      <CardBody>
        <FactoryResults
          query={query}
          results={results.map(entry => ({
            id: entry.id,
            name: entry.name,
            crNumber: entry.cr_number,
            licenseNumber: entry.license_number,
            grade: entry.grade,
            degraded: entry.degraded,
            duplicate: entry.duplicate,
          }))}
          registryUnavailable={registryUnavailable}
          settled={settled}
          matchedElsewhere={matchedElsewhere}
          selectedId={selectedId}
          onQueryChange={onQueryChange}
          onSelect={onSelect}
          onRetry={onRetry}
          dossierFor={id => {
            const found = results.find(entry => entry.id === id);
            return found ? <IdentityDossier factory={found} strings={strings} locale={locale} /> : null;
          }}
          strings={{
            fieldLabel: strings.searchFieldLabel,
            searchPlaceholder: strings.searchPlaceholder,
            promptTitle: strings.searchPromptTitle,
            promptBody: strings.searchPromptBody,
            exactBadge: strings.exactBadge,
            similarBadge: strings.similarBadge,
            degradedBadge: strings.degradedBadge,
            duplicateWarning: strings.duplicateWarning,
            noMatch: strings.noMatch,
            noMatchBody: strings.noMatchBody,
            registryUnavailable: strings.registryUnavailable,
            retry: strings.retry,
            absent: strings.absent,
            searching: strings.searching,
          }}
        />
      </CardBody>
    </Card>
  );
}
