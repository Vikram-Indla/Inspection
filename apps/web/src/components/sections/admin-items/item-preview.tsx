"use client";

import { useId, useState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Select from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Overline, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { Messages } from "@/i18n/messages";
import type { PreviewItem } from "@/features/admin-items/types";
import styles from "./admin-items.module.css";

export default function ItemPreview({ items, strings }: { items: readonly PreviewItem[]; strings: Messages["adminItems"] }) {
  const selectId = useId();
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  const p = strings.preview;
  const label = (value: string) => strings.enum[value as keyof typeof strings.enum] ?? value.replace(/_/g, " ");

  if (items.length === 0) {
    return <EmptyState variant="inline" icon="reveal" title={p.empty} />;
  }
  const item = items.find(candidate => candidate.id === selected) ?? items[0];

  return (
    <Card as="section">
      <CardBody gap="loose">
        <Select id={selectId} label={p.select} value={item.id} onChange={setSelected}
          options={items.map(candidate => ({
            value: candidate.id,
            label: `${candidate.code} — ${candidate.title}${candidate.active ? "" : ` (${p.deactivatedWord})`}`,
          }))} />

        <div className={styles.previewBody}>
          <div className={styles.previewHead}>
            <Mono>{item.code}</Mono>
            <Text as="span">{item.title}</Text>
            <StatusPill tone={item.active ? "success" : "danger"}>{item.active ? p.active : p.deactivatedWord}</StatusPill>
          </div>
          {!item.active ? <Text tone="muted">{p.deactivated}</Text> : null}

          <div className={styles.previewGroup}>
            <Overline>{p.responsesLabel}</Overline>
            <div className={styles.previewResponses} role="group" aria-label={p.responsesLabel}>
              {item.responses.map(response => (
                <Button key={response} variant="secondary" size="sm" disabled label={label(response)}>{label(response)}</Button>
              ))}
            </div>
            {item.ncTarget ? <Text tone="muted">{fill(p.ncMaps, { target: item.ncTarget })}</Text> : null}
            <Text tone="muted">{item.requirement === "optional" ? p.optional : item.requirement === "conditional" ? p.conditional : p.required}</Text>
            {item.conditionalRule ? (
              <Text tone="muted"><bdi dir="ltr">{item.conditionalRule}</bdi>{item.mandatoryWhenVisible ? ` · ${p.mandatoryVisible}` : ""}</Text>
            ) : null}
          </div>

          <div className={styles.previewGroup}>
            <Overline>{p.evidenceLabel}</Overline>
            <Text tone="muted">
              {item.evidence?.mandatory
                ? fill(p.evidenceRequired, { type: item.evidence.type ?? strings.sem.evidence, min: item.evidence.min ?? 1 })
                : p.evidenceNone}
            </Text>
            <Text tone="muted">{p.evidenceSource}</Text>
          </div>

          <div className={styles.previewGroup}>
            <Overline>{p.scoringLabel}</Overline>
            <Text tone="muted">
              {!item.scoringEnabled ? p.scoringOff : item.scoreWeight != null ? fill(p.weight, { weight: item.scoreWeight }) : p.noWeight}
              {item.scoreExcludedOn.length > 0 ? ` · ${fill(p.scoreExcluded, { responses: item.scoreExcludedOn.map(label).join(", ") })}` : ""}
            </Text>
          </div>

          <div className={styles.previewGroup}>
            <Overline>{p.guidanceLabel}</Overline>
            <Text tone="muted">{item.guidance || p.guidanceNone}</Text>
          </div>
        </div>

        <Text tone="muted">{p.readonly}</Text>
      </CardBody>
    </Card>
  );
}
