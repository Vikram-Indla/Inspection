import { type ReactNode } from "react";
import Choice from "@/components/saqeel/choice/choice";
import DateRangePicker, { type DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
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
  windowPick: string; windowClear: string; windowApply: string; windowEmpty: string;
  windowStartTime: string; windowEndTime: string; previousMonth: string; nextMonth: string;
  presetNext7: string; presetNext30: string; presetNext90: string;
};

const windowPresets = (strings: ReviewContextStrings): readonly DateRangePreset[] => [
  { id: "next-7", label: strings.presetNext7, days: 7, direction: "future" },
  { id: "next-30", label: strings.presetNext30, days: 30, direction: "future" },
  { id: "next-90", label: strings.presetNext90, days: 90, direction: "future" },
];

export default function ReviewContext({
  freshness, selectedCount, retainedCount, manual, auto,
  visitType, visitTypeOptions, mode, modeOptions, priority, priorityOptions,
  packages, windowStart, windowEnd, draftBanner, draftUnavailable,
  strings, locale, onGovernedValueChange, onPriorityChange, onPackageToggle, onWindowChange,
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
  locale: "ar" | "en";
  onWindowChange: (range: { from: string; to: string }) => void;
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
            <Text as="span" tone="muted">{`${strings.selected} / ${strings.retained}`}</Text>
            <Text as="span" role="bodyStrong" numeric>
              {selectedCount === retainedCount ? selectedCount : `${selectedCount} → ${retainedCount}`}
            </Text>
          </span>
          <span className={styles.fact}>
            <Text as="span" tone="muted">{strings.visits}</Text>
            <Text as="span" role="bodyStrong" numeric>{retainedCount}</Text>
          </span>
          <span className={styles.fact}>
            <Text as="span" tone="muted">{strings.assignments}</Text>
            <Text as="span" role="bodyStrong" numeric>{`${manual} ${strings.manual} · ${auto} ${strings.auto}`}</Text>
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
          <legend><Text as="span" tone="muted">{strings.packageLabel}</Text></legend>
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

        <Field label={strings.window}>
          <DateRangePicker
            from={windowStart}
            to={windowEnd}
            onChange={onWindowChange}
            label={strings.windowPick}
            displayValue={windowStart && windowEnd ? `${windowStart} → ${windowEnd}` : strings.windowEmpty}
            presets={windowPresets(strings)}
            locale={locale}
            monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
            strings={{
              from: strings.windowStart,
              to: strings.windowEnd,
              pickStart: strings.windowStart,
              pickEnd: strings.windowEnd,
              reset: strings.windowClear,
              apply: strings.windowApply,
              empty: strings.windowEmpty,
            }}
            timeLabels={{ from: strings.windowStartTime, to: strings.windowEndTime }}
            withTime
            block
          />
        </Field>
      </CardBody>
    </Card>
  );
}
