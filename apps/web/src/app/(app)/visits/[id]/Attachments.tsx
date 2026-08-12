"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import FileUpload from "@/components/saqeel/file-upload/file-upload";
import { Text } from "@/components/saqeel/type";
import { removeVisitAttachment, uploadVisitAttachment, type ActionResult } from "./actions";
import styles from "./action-bar.module.css";

export type AttachmentRow = {
  id: string;
  name: string;
  mime: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string | null;
  urlError: string | null;
};

export type AttachmentsStrings = {
  heading: string;
  hint: string;
  empty: string;
  colFile: string;
  colType: string;
  colUploaded: string;
  colBy: string;
  colActions: string;
  download: string;
  remove: string;
  removeAria: string;
  fileLabel: string;
  dropPrompt: string;
  browse: string;
  fileSelected: string;
  previewAlt: string;
  removeFile: string;
  uploadBtn: string;
  urlFailed: string;
};

function RemoveButton({ attachmentId, visitId, name, strings }: {
  attachmentId: string;
  visitId: string;
  name: string;
  strings: AttachmentsStrings;
}) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(removeVisitAttachment, {});
  return (
    <form action={act} className={styles.row}>
      <input type="hidden" name="attachment_id" value={attachmentId} />
      <input type="hidden" name="visit_id" value={visitId} />
      <Button
        type="submit"
        variant="tertiary"
        size="sm"
        busy={pending}
        label={strings.removeAria.replace("{name}", name)}
      >
        {strings.remove}
      </Button>
      {state.error && <Text as="span" role="label" tone="danger" live="alert">{state.error}</Text>}
    </form>
  );
}

export default function Attachments({ visitId, rows, strings }: {
  visitId: string;
  rows: AttachmentRow[];
  strings: AttachmentsStrings;
}) {
  const [up, upAct, upPending] = useActionState<ActionResult, FormData>(uploadVisitAttachment, {});
  const columns: DataColumn<AttachmentRow>[] = [
    { key: "file", header: strings.colFile, isRowHeader: true, cell: row => row.name },
    { key: "type", header: strings.colType, cell: row => row.mime },
    { key: "uploaded", header: strings.colUploaded, numeric: true, cell: row => row.uploadedAt },
    { key: "by", header: strings.colBy, cell: row => row.uploadedBy },
    {
      key: "actions",
      header: strings.colActions,
      width: "min",
      cell: row => (
        <div className={styles.row}>
          {row.url
            ? <Button variant="tertiary" size="sm" href={row.url} label={`${strings.download} — ${row.name}`}>{strings.download}</Button>
            : <Text as="span" role="label" tone="warning" live="status">{row.urlError ?? strings.urlFailed}</Text>}
          <RemoveButton attachmentId={row.id} visitId={visitId} name={row.name} strings={strings} />
        </div>
      ),
    },
  ];
  return (
    <Card as="section" labelledBy="visit-attachments-heading">
      <CardHeader level="h2" titleId="visit-attachments-heading" title={strings.heading} description={strings.hint} />
      <CardBody gap="tight">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          caption={strings.heading}
          empty={{ icon: "library", title: strings.empty }}
        />
        <form action={upAct} className={styles.uploadForm}>
          <input type="hidden" name="visit_id" value={visitId} />
          <FileUpload
            name="file"
            id="visit-attachment-file"
            required
            strings={{
              label: strings.fileLabel,
              prompt: strings.dropPrompt,
              browse: strings.browse,
              selected: strings.fileSelected,
              previewAlt: strings.previewAlt,
              remove: strings.removeFile,
            }}
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="secondary" busy={upPending} label={strings.uploadBtn}>
              {strings.uploadBtn}
            </Button>
          </div>
        </form>
        {up.error && <Text as="p" role="label" tone="danger" live="alert">{up.error}</Text>}
        {up.ok && <Text as="p" role="label" tone="success" live="status">{up.ok}</Text>}
      </CardBody>
    </Card>
  );
}
