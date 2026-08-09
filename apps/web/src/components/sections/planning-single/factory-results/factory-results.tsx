"use client";
import { type ReactNode } from "react";
import Choice from "@/components/saqeel/choice/choice";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import Button from "@/components/saqeel/button/button";
import styles from "./factory-results.module.css";

export type GradedResult = {
  readonly id: string;
  readonly name: string;
  readonly crNumber: string | null;
  readonly licenseNumber: string | null;
  readonly grade: "exact" | "similar_name";
  readonly degraded: boolean;
  readonly duplicate: boolean;
};

export type FactoryResultsStrings = {
  readonly heading: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly exactBadge: string;
  readonly similarBadge: string;
  readonly degradedBadge: string;
  readonly duplicateWarning: string;
  readonly noMatch: string;
  readonly noMatchBody: string;
  readonly registryUnavailable: string;
  readonly retry: string;
  readonly absent: string;
};

/**
 * The graded candidate list.
 *
 * Nothing is pre-selected by a search: choosing a radio is the explicit act
 * that selects a target and opens its dossier (M01-035). The grade is a **rule**
 * — exact identifier equality, or a name match with differing identifiers — and
 * never a score, so it renders as a labelled pill rather than a number.
 */
export default function FactoryResults({
  query, results, registryUnavailable, selectedId, dossierFor, onQueryChange, onSelect, onRetry, strings,
}: {
  query: string;
  results: readonly GradedResult[];
  registryUnavailable: boolean;
  selectedId: string | null;
  dossierFor: (id: string) => ReactNode;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  strings: FactoryResultsStrings;
}) {
  const searching = query.trim().length >= 3;

  return (
    <div className={styles.root}>
      <TextInput
        type="search"
        value={query}
        onChange={onQueryChange}
        placeholder={strings.searchPlaceholder}
        label={strings.searchLabel}
      />

      {searching && registryUnavailable ? (
        <div className={styles.notice}>
          <EmptyState tone="danger" size="sm" variant="inline" title={strings.registryUnavailable} />
          <Button variant="secondary" size="sm" onClick={onRetry} label={strings.retry}>{strings.retry}</Button>
        </div>
      ) : null}

      {searching && !registryUnavailable && results.length === 0 ? (
        <EmptyState size="sm" title={strings.noMatch} description={strings.noMatchBody} />
      ) : null}

      {results.length > 0 ? (
        <ul className={styles.list}>
          {results.map(result => (
            <li className={styles.item} key={result.id} data-selected={result.id === selectedId ? "" : undefined}>
              <Choice
                kind="radio"
                name="factory_id"
                value={result.id}
                checked={result.id === selectedId}
                onChange={() => onSelect(result.id)}
                label={
                  <span className={styles.identity}>
                    <span className={styles.name}>{result.name}</span>
                    <span className={styles.pills}>
                      <StatusPill tone={result.grade === "exact" ? "success" : "warning"}>
                        {result.grade === "exact" ? strings.exactBadge : strings.similarBadge}
                      </StatusPill>
                      {result.degraded ? <StatusPill tone="danger">{strings.degradedBadge}</StatusPill> : null}
                      {result.duplicate ? <StatusPill tone="warning">{strings.duplicateWarning}</StatusPill> : null}
                    </span>
                  </span>
                }
                description={
                  <span className={styles.codes}>
                    <bdi>{result.crNumber ?? strings.absent}</bdi>
                    {result.licenseNumber ? <bdi>{result.licenseNumber}</bdi> : null}
                  </span>
                }
              />
              {result.id === selectedId ? <div className={styles.dossier}>{dossierFor(result.id)}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
