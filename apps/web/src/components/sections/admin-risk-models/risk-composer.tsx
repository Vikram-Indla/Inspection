"use client";

import { useActionState, useMemo, useState } from "react";
import { createRiskDraft, type RiskResult } from "@/app/(app)/admin/risk/models/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import { validateRiskModelPayload, type RiskModelPayload } from "@/lib/risk/model";
import styles from "./risk-models.module.css";

type Copy = Messages["adminRiskModels"];

const toNumber = (value: string): number => value === "" ? Number.NaN : Number(value);

export default function RiskComposer({ copy }: { copy: Copy }) {
  const c = copy.composer;
  const [state, action, creating] = useActionState<RiskResult, FormData>(createRiskDraft, {});
  const [factors, setFactors] = useState([{ key: "", weight: Number.NaN }]);
  const [lowMax, setLowMax] = useState<number>(Number.NaN);
  const [medMax, setMedMax] = useState<number>(Number.NaN);

  const payload = useMemo<RiskModelPayload>(() => ({
    factors,
    bands: { low: [0, lowMax], medium: [lowMax + 1, medMax], high: [medMax + 1, 100] },
  }), [factors, lowMax, medMax]);
  const validation = validateRiskModelPayload(payload);

  return (
    <Card as="section">
      <CardHeader level="h2" title={c.heading} description={c.payload} />
      <CardBody>
        <form action={action} className={styles.composer}>
          <Field label={c.newLabel} htmlFor="risk-version-label">
            <TextInput id="risk-version-label" name="version_label" placeholder={c.versionPlaceholder} required />
          </Field>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <Text role="label" tone="secondary" as="span">{`${c.factorKey} · ${c.factorWeight}`}</Text>
            </legend>
            {factors.map((factor, index) => (
              <div className={styles.factorRow} key={index}>
                <Field label={c.factorKey} htmlFor={`risk-factor-${index}`}>
                  <TextInput id={`risk-factor-${index}`} value={factor.key} placeholder={c.factorKeyPlaceholder} required
                    onChange={value => setFactors(current => current.map((item, i) => i === index ? { ...item, key: value } : item))} />
                </Field>
                <Field label={c.factorWeight} htmlFor={`risk-weight-${index}`}>
                  <TextInput id={`risk-weight-${index}`} type="number" value={Number.isFinite(factor.weight) ? String(factor.weight) : ""} required
                    onChange={value => setFactors(current => current.map((item, i) => i === index ? { ...item, weight: toNumber(value) } : item))} />
                </Field>
                <Button type="button" variant="tertiary" size="sm" disabled={factors.length === 1}
                  onClick={() => setFactors(current => current.filter((_, i) => i !== index))}>{c.removeFactor}</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" icon="create"
              onClick={() => setFactors(current => [...current, { key: "", weight: Number.NaN }])}>{c.addFactor}</Button>

            <div className={styles.bandRow}>
              <Field label={c.lowEnds} htmlFor="risk-low">
                <TextInput id="risk-low" type="number" value={Number.isFinite(lowMax) ? String(lowMax) : ""} required
                  onChange={value => setLowMax(toNumber(value))} />
              </Field>
              <Field label={c.mediumEnds} htmlFor="risk-medium">
                <TextInput id="risk-medium" type="number" value={Number.isFinite(medMax) ? String(medMax) : ""} required
                  onChange={value => setMedMax(toNumber(value))} />
              </Field>
            </div>
          </fieldset>

          <input type="hidden" name="payload" value={JSON.stringify(payload)} />
          <Text tone={validation.ok ? "success" : "muted"} live="status">
            {validation.ok ? c.validationReady : `${c.validationNeeded}: ${validation.why}`}
          </Text>

          <div className={styles.footer}>
            <Button type="submit" variant="primary" size="sm" disabled={creating || !validation.ok}>{creating ? c.creating : c.create}</Button>
            {state.error ? <Text tone="danger" live="alert">{state.error}</Text> : null}
            {state.ok ? <Text tone="success" live="status">{c.created}</Text> : null}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
