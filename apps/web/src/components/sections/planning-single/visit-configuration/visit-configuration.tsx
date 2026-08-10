"use client";
import Choice from "@/components/saqeel/choice/choice";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import { upcomingDateRangePresets, type DateRangePresetLabels } from "@/components/saqeel/date-range-picker/date-range-presets";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import type { ExecutionMode, ModeEligibility } from "@/features/planning-single/target";
import styles from "./visit-configuration.module.css";

export type VisitPackage = {
  readonly id: string;
  readonly versionLabel: string;
  readonly code: string;
  readonly title: string;
};

export type VisitConfigurationStrings = {
  readonly visitType: string;
  readonly packageLabel: string;
  readonly packageOptionalHint: string;
  readonly mode: string;
  readonly modePhysical: string;
  readonly modeVirtual: string;
  readonly modeIneligible: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly window: string;
  readonly windowStartTime: string;
  readonly windowEndTime: string;
  readonly windowClear: string;
  readonly windowApply: string;
  readonly windowEmpty: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly presetLabels: DateRangePresetLabels;
  readonly windowHint: string;
  readonly inspector: string;
  readonly autoAssign: string;
  readonly notes: string;
  readonly notesPlaceholder: string;
  readonly noPackages: string;
};

export type VisitConfigurationValue = {
  readonly visitType: string;
  readonly packageIds: readonly string[];
  readonly mode: ExecutionMode;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly inspectorId: string;
  readonly notes: string;
};

/**
 * The visit configuration fields.
 *
 * Every control is React-controlled on purpose: a blocked publish re-renders
 * this form through `useActionState`, and an uncontrolled date, radio or
 * checkbox loses its entered value on that re-render — silently discarding the
 * planner's work. The legacy screen worked around it with a `resetKey` counter
 * threaded through eight controls to force remounts; controlled values need no
 * such counter.
 */
export default function VisitConfiguration({
  value, onChange, visitTypeOptions, inspectorOptions, packages, eligibility, locale, strings,
}: {
  value: VisitConfigurationValue;
  locale: "ar" | "en";
  onChange: (next: VisitConfigurationValue) => void;
  visitTypeOptions: readonly SelectOption[];
  inspectorOptions: readonly SelectOption[];
  packages: readonly VisitPackage[];
  eligibility: ModeEligibility;
  strings: VisitConfigurationStrings;
}) {
  const set = <K extends keyof VisitConfigurationValue>(key: K, next: VisitConfigurationValue[K]) =>
    onChange({ ...value, [key]: next });

  const readableWindow = (value: string) => {
    const [day, time] = value.split("T");
    if (!day) return strings.windowEmpty;
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(`${day}T00:00:00`));
    return time ? `${date} ${time}` : date;
  };
  const windowDisplay = value.windowStart || value.windowEnd
    ? `${readableWindow(value.windowStart)} — ${readableWindow(value.windowEnd)}`
    : strings.windowEmpty;

  const togglePackage = (id: string, checked: boolean) =>
    set("packageIds", checked
      ? [...value.packageIds, id]
      : value.packageIds.filter(current => current !== id));

  return (
    <div className={styles.root}>
      <input type="hidden" name="visit_type" value={value.visitType} />
      <input type="hidden" name="execution_mode" value={value.mode} />
      <input type="hidden" name="inspector_id" value={value.inspectorId} />
      <input type="hidden" name="window_start" value={value.windowStart} />
      <input type="hidden" name="window_end" value={value.windowEnd} />
      {value.packageIds.map(id => <input key={id} type="hidden" name="package_version_id" value={id} />)}

      <div className={styles.fields}>
        <Field label={strings.visitType}>
          <SaqeelSelect
            options={visitTypeOptions}
            value={value.visitType}
            onChange={next => set("visitType", next)}
            label={strings.visitType}
          />
        </Field>

        <Field label={strings.inspector}>
          <SaqeelSelect
            options={[{ value: "", label: strings.autoAssign }, ...inspectorOptions]}
            value={value.inspectorId}
            onChange={next => set("inspectorId", next)}
            label={strings.inspector}
          />
        </Field>
      </div>

      <div className={styles.fields}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{strings.mode}</legend>
          <Choice
            kind="radio"
            name="execution_mode_choice"
            value="physical"
            label={strings.modePhysical}
            description={eligibility.physical ? undefined : strings.modeIneligible}
            checked={value.mode === "physical"}
            disabled={!eligibility.physical}
            onChange={() => set("mode", "physical")}
          />
          <Choice
            kind="radio"
            name="execution_mode_choice"
            value="virtual"
            label={strings.modeVirtual}
            description={eligibility.virtual ? undefined : strings.modeIneligible}
            checked={value.mode === "virtual"}
            disabled={!eligibility.virtual}
            onChange={() => set("mode", "virtual")}
          />
        </fieldset>

        <Field label={strings.window}>
          <DateRangePicker
            from={value.windowStart}
            to={value.windowEnd}
            onChange={range => onChange({ ...value, windowStart: range.from, windowEnd: range.to })}
            label={strings.window}
            displayValue={windowDisplay}
            block
            presets={upcomingDateRangePresets(strings.presetLabels)}
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
          />
        </Field>
      </div>
      <p className={styles.hint}>{strings.windowHint}</p>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{strings.packageLabel}</legend>
        <p className={styles.hint}>{strings.packageOptionalHint}</p>
        {packages.length === 0 ? (
          <EmptyState variant="inline" size="sm" title={strings.noPackages} />
        ) : (
          <div className={styles.choices}>
            {packages.map(entry => (
              <Choice
                key={entry.id}
                kind="checkbox"
                name="package_version_choice"
                value={entry.id}
                label={entry.title}
                description={`${entry.code} · ${entry.versionLabel}`}
                checked={value.packageIds.includes(entry.id)}
                onChange={checked => togglePackage(entry.id, checked)}
              />
            ))}
          </div>
        )}
      </fieldset>

      <Field label={strings.notes} htmlFor="single-visit-notes">
        <Textarea
          id="single-visit-notes"
          name="notes"
          rows={3}
          value={value.notes}
          placeholder={strings.notesPlaceholder}
          onChange={next => set("notes", next)}
        />
      </Field>
    </div>
  );
}
