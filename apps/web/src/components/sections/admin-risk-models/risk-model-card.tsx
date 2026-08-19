"use client";

import { useActionState, useId } from "react";
import { transitionRiskModel, type RiskResult } from "@/app/(app)/admin/risk/models/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { RiskModelRow } from "@/features/admin-risk-models/queries";
import { fill, type Messages } from "@/i18n/messages";
import { isRiskModelTransitionAllowed, RISK_MODEL_STATUSES } from "@/lib/risk/model";
import styles from "./risk-models.module.css";

type Copy = Messages["adminRiskModels"];

const STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  draft: "neutral", review: "pending", approved: "info", published: "success", retired: "neutral",
};

export default function RiskModelCard({ model, copy }: { model: RiskModelRow; copy: Copy }) {
  const [state, action, applying] = useActionState<RiskResult, FormData>(transitionRiskModel, {});
  const fieldId = useId();
  const targets = RISK_MODEL_STATUSES.filter(target => isRiskModelTransitionAllowed(model.status, target));
  const statusLabel = (value: string): string => copy.statusLabels[value as keyof typeof copy.statusLabels] ?? value;

  const factorItems = (model.payload?.factors ?? []).map(factor => ({
    label: factor.key,
    value: <Mono>{String(factor.weight)}</Mono>,
  }));

  return (
    <Card as="article">
      <CardBody>
        <div className={styles.modelHead}>
          <Heading level={3} visual="bodyStrong">
            {`${model.version_label} `}<Mono tone="muted">{fill(copy.card.version, { n: model.row_version })}</Mono>
          </Heading>
          <StatusPill tone={STATUS_TONE[model.status] ?? "neutral"} ping={false}>{statusLabel(model.status)}</StatusPill>
        </div>

        <details className={styles.detail}>
          <summary className={styles.summary}>{copy.card.inspect}</summary>
          <div className={styles.detailBody}>
            <DefinitionList items={factorItems} columns="two" />
            {model.payload?.bands ? (
              <div className={styles.chips}>
                {Object.entries(model.payload.bands).map(([key, range]) => (
                  <span key={key} className={styles.chip}>
                    <Text role="label" tone="secondary" as="span"><Mono>{`${key}: ${range[0]}–${range[1]}`}</Mono></Text>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </details>

        {model.status === "published" ? <Text tone="muted">{copy.card.immutable}</Text> : null}

        {targets.length ? (
          <form action={action} className={styles.transitionForm}>
            <input type="hidden" name="model_id" value={model.id} />
            <input type="hidden" name="from_status" value={model.status} />
            <input type="hidden" name="row_version" value={model.row_version} />
            <Field label={copy.card.transition} htmlFor={`${fieldId}-to`}>
              <SaqeelSelect id={`${fieldId}-to`} name="to_status" label={copy.card.transition}
                options={targets.map(target => ({ value: target, label: statusLabel(target) }))} />
            </Field>
            <Field label={copy.card.reason} htmlFor={`${fieldId}-reason`}>
              <TextInput id={`${fieldId}-reason`} name="reason" placeholder={copy.card.reasonPlaceholder} />
            </Field>
            <div className={styles.footer}>
              <Button type="submit" variant="primary" size="sm" disabled={applying}>{applying ? copy.card.applying : copy.card.apply}</Button>
              {state.error ? <Text tone="danger" live="alert">{state.error}</Text> : null}
              {state.ok ? <Text tone="success" live="status">{copy.card.done}</Text> : null}
            </div>
          </form>
        ) : (
          <Text tone="muted">{copy.card.noTransitions}</Text>
        )}
      </CardBody>
    </Card>
  );
}
