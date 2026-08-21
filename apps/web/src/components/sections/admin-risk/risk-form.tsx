"use client";

import { type CSSProperties, useActionState, useMemo, useState } from "react";
import { saveRiskSettings } from "@/app/(app)/admin/risk/actions";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import { Checkbox } from "@/components/saqeel/inputs/Choice";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import { type RiskBands, validateBands, validateWeights } from "@/lib/risk/model";
import type { RiskFactor, RiskSaveErrorCode, RiskSaveResult } from "@/features/admin-risk/types";
import styles from "./admin-risk.module.css";

export type RiskFormLabels = {
  factorsTitle: string;
  bandsTitle: string;
  lowEnds: string;
  mediumEnds: string;
  high: string;
  sumOk: string;
  sumBad: string;
  save: string;
  saving: string;
  saved: string;
  savedNote: string;
  lastUpdated: string;
  bandLow: string;
  bandMedium: string;
  bandHigh: string;
  invalidBands: string;
  confirmLive: string;
  weightAria: string;
};

export type RiskSaveErrorLabels = Record<RiskSaveErrorCode, string>;

type SaveState = RiskSaveResult;

export default function RiskForm({
  factors,
  lowMax: initialLow,
  medMax: initialMed,
  updatedAtLabel,
  labels,
  saveErrors,
}: {
  factors: readonly RiskFactor[];
  lowMax: number;
  medMax: number;
  updatedAtLabel: string;
  labels: RiskFormLabels;
  saveErrors: RiskSaveErrorLabels;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(factors.map(factor => [factor.key, factor.weight])),
  );
  const [lowMax, setLowMax] = useState(initialLow);
  const [medMax, setMedMax] = useState(initialMed);
  const [confirmedLive, setConfirmedLive] = useState(false);

  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_previous, formData) => await saveRiskSettings(formData),
    {},
  );

  const sum = useMemo(
    () => Object.values(weights).reduce((total, weight) => total + (Number.isFinite(weight) ? weight : 0), 0),
    [weights],
  );
  const weightsOk = validateWeights(factors.map(factor => ({ key: factor.key, weight: weights[factor.key] }))).ok;
  const bands: RiskBands = { low: [0, lowMax], medium: [lowMax + 1, medMax], high: [medMax + 1, 100] };
  const bandsOk = validateBands(bands).ok;
  const maxWeight = Math.max(0.0001, ...Object.values(weights).map(weight => (Number.isFinite(weight) ? weight : 0)));

  return (
    <form action={formAction} className={styles.form}>
      <Text role="label" as="p">{labels.factorsTitle}</Text>

      <div className={styles.factors}>
        {factors.map(factor => {
          const weight = weights[factor.key] ?? 0;
          const percent = Math.round((Number.isFinite(weight) ? weight : 0) / maxWeight * 100);
          const barStyle = { ["--weight-fill"]: `${percent}%` } as CSSProperties;
          return (
            <div key={factor.key} className={styles.factor}>
              <Field label={factor.name} htmlFor={`risk-weight-${factor.key}`}>
                <TextInput
                  id={`risk-weight-${factor.key}`}
                  name={factor.key}
                  type="number"
                  inputMode="decimal"
                  value={Number.isFinite(weight) ? String(weight) : ""}
                  onChange={next => setWeights(previous => ({ ...previous, [factor.key]: Number.parseFloat(next) }))}
                />
              </Field>
              <div className={styles.weightBar} style={barStyle} aria-hidden="true"><span /></div>
            </div>
          );
        })}
      </div>

      <div role="status" aria-live="polite">
        {weightsOk
          ? <StatusPill tone="success">{labels.sumOk}</StatusPill>
          : <StatusPill tone="danger">{fill(labels.sumBad, { sum: sum.toFixed(2) })}</StatusPill>}
      </div>

      <Text role="label" as="p">{labels.bandsTitle}</Text>
      <div className={styles.bandInputs}>
        <Field label={labels.lowEnds} htmlFor="risk-low-max">
          <TextInput id="risk-low-max" name="low_max" type="number" inputMode="numeric"
            value={String(lowMax)} onChange={next => setLowMax(Number.parseInt(next, 10))} />
        </Field>
        <Field label={labels.mediumEnds} htmlFor="risk-med-max">
          <TextInput id="risk-med-max" name="med_max" type="number" inputMode="numeric"
            value={String(medMax)} onChange={next => setMedMax(Number.parseInt(next, 10))} />
        </Field>
        <Field label={labels.high} htmlFor="risk-high-band">
          <TextInput id="risk-high-band" readOnly value={`${(Number.isFinite(medMax) ? medMax : 0) + 1}–100`} />
        </Field>
      </div>

      <div className={styles.bandChips}>
        <StatusPill tone="success">{`${labels.bandLow} 0–${lowMax}`}</StatusPill>
        <StatusPill tone="warning">{`${labels.bandMedium} ${lowMax + 1}–${medMax}`}</StatusPill>
        <StatusPill tone="danger">{`${labels.bandHigh} ${medMax + 1}–100`}</StatusPill>
      </div>
      {!bandsOk ? <Text as="p" role="label" tone="danger">{labels.invalidBands}</Text> : null}

      <div className={styles.saveRow}>
        <Text as="p" role="label" tone="secondary">{`${labels.lastUpdated} ${updatedAtLabel}`}</Text>
        <div className={styles.saveActions}>
          {state.ok && !pending ? <StatusPill tone="success">{labels.saved}</StatusPill> : null}
          <Button type="submit" variant="primary" size="lg"
            disabled={pending || !weightsOk || !bandsOk || !confirmedLive}
            label={pending ? labels.saving : labels.save}>
            {pending ? labels.saving : labels.save}
          </Button>
        </div>
      </div>

      <Checkbox checked={confirmedLive} onChange={event => setConfirmedLive(event.target.checked)} label={labels.confirmLive} />

      {state.error ? <Text as="p" role="label" tone="danger">{saveErrors[state.error]}</Text> : null}
      <Text as="p" role="label" tone="secondary">{labels.savedNote}</Text>
    </form>
  );
}
