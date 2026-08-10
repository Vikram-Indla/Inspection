import { type ReactNode } from "react";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import styles from "./review-context.module.css";

export type PackageChoice = { id: string; label: string; checked: boolean };

export type ReviewContextStrings = {
  method: string; freshnessPrefix: string;
  stagedBanner: string; draftUnavailable: string; unavailableTag: string;
  selected: string; retained: string; visits: string; assignments: string;
  manual: string; auto: string;
  visitType: string; mode: string; priorityLabel: string; priorityNone: string;
  packageLabel: string; packageHint: string;
  window: string; windowStart: string; windowEnd: string;
};

export default function ReviewContext({
  freshness, selectedCount, retainedCount, manual, auto,
  visitType, visitTypeOptions, mode, modeOptions, priority, priorityOptions,
  packages, windowStart, windowEnd, draftBanner, draftUnavailable,
  strings, onGovernedValueChange, onPriorityChange, onPackageToggle, onWindowStartChange, onWindowEndChange,
}: {
  freshness: string;
  selectedCount: number;
  retainedCount: number;
  manual: number;
  auto: number;
  visitType: string;
  visitTypeOptions: readonly SelectOption[];
  mode: string;
  modeOptions: readonly SelectOption[];
  priority: string;
  priorityOptions: readonly SelectOption[];
  packages: readonly PackageChoice[];
  windowStart: string;
  windowEnd: string;
  draftBanner: ReactNode;
  draftUnavailable: boolean;
  strings: ReviewContextStrings;
  onGovernedValueChange: () => void;
  onPriorityChange: (value: string) => void;
  onPackageToggle: (id: string, checked: boolean) => void;
  onWindowStartChange: (value: string) => void;
  onWindowEndChange: (value: string) => void;
}) {
  return (
    <Card as="section">
      <CardHeader
        title={strings.method}
        description={strings.stagedBanner}
        trailing={freshness ? <StatusPill tone="neutral" ping={false}>{`${strings.freshnessPrefix} ${freshness}`}</StatusPill> : undefined}
      />
      <CardBody gap="default">
        {draftBanner}
        {draftUnavailable && (
          <PlanningNotice tone="warning" label={strings.unavailableTag}>{strings.draftUnavailable}</PlanningNotice>
        )}

        <div className={styles.facts}>
          <span className={styles.fact}>
            <span className={styles.label}>{`${strings.selected} / ${strings.retained}`}</span>
            <span className={styles.value}>
              {selectedCount === retainedCount ? selectedCount : `${selectedCount} → ${retainedCount}`}
            </span>
          </span>
          <span className={styles.fact}>
            <span className={styles.label}>{strings.visits}</span>
            <span className={styles.value}>{retainedCount}</span>
          </span>
          <span className={styles.fact}>
            <span className={styles.label}>{strings.assignments}</span>
            <span className={styles.value}>{`${manual} ${strings.manual} · ${auto} ${strings.auto}`}</span>
          </span>
        </div>

        <div className={styles.controls}>
          <Field label={strings.visitType}>
            <SaqeelSelect options={visitTypeOptions} value={visitType} label={strings.visitType} onChange={onGovernedValueChange} />
          </Field>
          <Field label={strings.mode}>
            <SaqeelSelect options={modeOptions} value={mode} label={strings.mode} onChange={onGovernedValueChange} />
          </Field>
          <Field label={strings.priorityLabel}>
            <SaqeelSelect
              options={[{ value: "", label: strings.priorityNone }, ...priorityOptions]}
              value={priority}
              label={strings.priorityLabel}
              onChange={onPriorityChange}
            />
          </Field>
        </div>

        <fieldset className={styles.packages}>
          <legend className={styles.label}>{strings.packageLabel}</legend>
          {packages.map(entry => (
            <Choice
              key={entry.id}
              kind="checkbox"
              name="review-package"
              value={entry.id}
              label={entry.label}
              checked={entry.checked}
              onChange={checked => onPackageToggle(entry.id, checked)}
            />
          ))}
          {packages.every(entry => !entry.checked) && (
            <PlanningNotice tone="info">{strings.packageHint}</PlanningNotice>
          )}
        </fieldset>

        <div className={styles.controls}>
          <Field label={strings.windowStart} htmlFor="review-window-start">
            <input
              className={styles.moment}
              id="review-window-start"
              name="window_start"
              type="datetime-local"
              value={windowStart}
              onChange={event => onWindowStartChange(event.target.value)}
            />
          </Field>
          <Field label={strings.windowEnd} htmlFor="review-window-end">
            <input
              className={styles.moment}
              id="review-window-end"
              name="window_end"
              type="datetime-local"
              value={windowEnd}
              onChange={event => onWindowEndChange(event.target.value)}
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  );
}
