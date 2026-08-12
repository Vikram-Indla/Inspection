"use client";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import type { ImmediatePackage } from "@/features/planning-immediate/types";
import styles from "./dispatch-checklist.module.css";

const HEADING_ID = "immediate-checklist";

export default function DispatchChecklist({ packages, value, messages, onChange }: {
  packages: readonly ImmediatePackage[];
  value: string;
  messages: ImmediateMessages["dispatch"];
  onChange: (packageId: string) => void;
}) {
  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardHeader
        level="h2"
        titleId={HEADING_ID}
        title={messages.packageLabel}
        description={messages.packageOptionalHint}
      />
      <CardBody gap="tight">
        <div className={styles.options} role="radiogroup" aria-labelledby={HEADING_ID}>
          {packages.map(entry => (
            <Choice
              key={entry.id}
              kind="radio"
              name="package_version_id"
              value={entry.id}
              checked={value === entry.id}
              label={entry.packages.title}
              description={`${entry.packages.code} · ${entry.version_label}`}
              onChange={() => onChange(entry.id)}
            />
          ))}
        </div>
        {value === "" ? null : (
          <Button type="button" variant="link" size="sm" label={messages.packageClear} onClick={() => onChange("")}>
            {messages.packageClear}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
