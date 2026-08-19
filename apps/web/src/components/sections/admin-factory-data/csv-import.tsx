"use client";

import { useActionState, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import FileUpload from "@/components/saqeel/file-upload/file-upload";
import Button from "@/components/saqeel/button/button";
import { Mono, Text } from "@/components/saqeel/type";
import { stageFactoryCsv, type FactoryDataResult } from "@/app/(app)/admin/integrations/factory-data/actions";
import { resultMessage, type AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import { fill } from "@/i18n/messages";
import styles from "./factory-data.module.css";

const SCHEMA_VERSION = "factory360-v2-staging-1";
const REQUIRED = ["cr_number", "license_number", "plant_number"];
const BOM = 0xfeff;

type Preview = { name: string; headers: string[]; rows: number; errors: string[] };

export default function CsvImport({ strings }: { strings: AdminFactoryDataMessages }) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(stageFactoryCsv, {});
  const [preview, setPreview] = useState<Preview | null>(null);
  const csv = strings.csv;

  async function inspect(files: FileList | null) {
    const file = files?.[0];
    if (!file) { setPreview(null); return; }
    const text = await file.text();
    const clean = text.charCodeAt(0) === BOM ? text.slice(1) : text;
    const lines = clean.split(/\r?\n/).filter(Boolean);
    const headers = (lines[0] ?? "").split(",").map(value => value.trim().replace(/^"|"$/g, ""));
    const errors = REQUIRED.filter(header => !headers.includes(header)).map(header => fill(strings.result.requiredHeaderMissing, { header }));
    setPreview({ name: file.name, headers, rows: Math.max(0, lines.length - 1), errors });
  }

  return (
    <Card as="section">
      <CardHeader level="h3" title={csv.title} />
      <CardBody>
        <form action={action} className={styles.formBody}>
          <input type="hidden" name="schema_version" value={SCHEMA_VERSION} />
          <FileUpload
            name="csv_file"
            accept=".csv,text/csv"
            required
            strings={csv.upload}
            onSelect={files => void inspect(files)}
          />
          <Text role="label" tone="muted">{fill(csv.schemaNote, { schema: SCHEMA_VERSION, required: REQUIRED.join(", ") })}</Text>
          {preview ? (
            <Card as="div">
              <CardBody gap="tight">
                <Text role="bodyStrong" dir="auto">{preview.name}</Text>
                <Text role="label" tone="muted">{fill(csv.previewRows, { rows: preview.rows, columns: preview.headers.length })}</Text>
                <Mono tone="muted">{preview.headers.join(" · ")}</Mono>
                {preview.errors.map(error => <Text key={error} tone="danger" role="label" live="alert">{error}</Text>)}
              </CardBody>
            </Card>
          ) : null}
          {state.error ? <Text tone="danger" role="bodyStrong" live="alert">{resultMessage(state.error, strings)}</Text> : null}
          {state.ok ? (
            <Text tone="success" role="bodyStrong" live="status">
              {fill(csv.staged, { batch: state.batchId ?? "", pending: state.pendingReconciliation ?? 0, rejected: state.rejected ?? 0 })}
            </Text>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending || Boolean(preview?.errors.length)}>
            {pending ? csv.staging : csv.stage}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
