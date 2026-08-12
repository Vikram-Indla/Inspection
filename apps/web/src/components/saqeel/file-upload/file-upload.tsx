"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import Icon from "@/components/saqeel/icon/icon";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { Text } from "@/components/saqeel/type";
import styles from "./file-upload.module.css";

export type FileUploadStrings = {
  /** Visible label for the control, e.g. "Attach a file". */
  readonly label: string;
  /** Primary instruction inside the zone, e.g. "Drag a file here". */
  readonly prompt: string;
  /** The word rendered as the keyboard-reachable browse affordance. */
  readonly browse: string;
  /** Shown and announced once a file is chosen, with `{name}` replaced. */
  readonly selected: string;
  /** Alternative text for the image preview, with `{name}` replaced. */
  readonly previewAlt: string;
  /** Accessible name of the control that discards a chosen file, with `{name}` replaced. */
  readonly remove: string;
  /** Optional constraint line, e.g. "PDF or image, up to 10 MB". */
  readonly hint?: string;
};

type Chosen = {
  readonly file: File;
  readonly previewUrl: string | null;
};

function describeFiles(files: FileList | null): Chosen[] {
  if (!files) return [];
  return [...files].map(file => ({
    file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  }));
}

function asFileList(chosen: Chosen[]): FileList {
  const transfer = new DataTransfer();
  chosen.forEach(item => transfer.items.add(item.file));
  return transfer.files;
}

function ChosenPreview({ chosen, strings, onRemove }: {
  chosen: Chosen;
  strings: FileUploadStrings;
  onRemove: () => void;
}) {
  return (
    <div className={styles.preview}>
      <span className={styles.well}>
        {chosen.previewUrl
          ? (
            <img
              key={chosen.previewUrl}
              className={styles.image}
              src={chosen.previewUrl}
              alt={strings.previewAlt.replace("{name}", chosen.file.name)}
              onLoad={event => URL.revokeObjectURL(event.currentTarget.src)}
            />
          )
          : <span className={styles.wellIcon}><Icon name="forms" size="xl" /></span>}
      </span>
      <span className={styles.bar}>
        <Text as="span" role="label" tone="muted">{chosen.file.type}</Text>
        <IconButton
          icon="dismiss"
          size="sm"
          label={strings.remove.replace("{name}", chosen.file.name)}
          onClick={onRemove}
        />
      </span>
    </div>
  );
}

/**
 * A file field that accepts both a click-to-browse and a drag-and-drop, and
 * still submits through a plain `<form action>`.
 *
 * The caller owns the `name` the server action reads from `FormData`, and owns
 * every string through `strings` — the component renders no copy of its own.
 * An image selection is previewed from an object URL that the preview releases
 * once it has decoded, and each chosen file can be discarded again.
 */
export default function FileUpload({ name, id, accept, multiple, required, strings, onSelect }: {
  name: string;
  id?: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  strings: FileUploadStrings;
  onSelect?: (files: FileList | null) => void;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [dragging, setDragging] = useState(false);

  function adopt(files: FileList | null) {
    chosen.forEach(item => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    setChosen(describeFiles(files));
    onSelect?.(files);
  }

  function discard(position: number) {
    const dropped = chosen[position];
    if (dropped.previewUrl) URL.revokeObjectURL(dropped.previewUrl);
    const kept = chosen.filter((_, index) => index !== position);
    setChosen(kept);
    if (!inputRef.current) return;
    inputRef.current.files = asFileList(kept);
    inputRef.current.focus();
    onSelect?.(inputRef.current.files);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files;
    if (!dropped.length || !inputRef.current) return;
    inputRef.current.files = dropped;
    adopt(dropped);
  }

  return (
    <div className={styles.root}>
      <Text as="span" role="label" tone="secondary" id={`${inputId}-label`}>{strings.label}</Text>
      <div className={styles.fields} data-filled={chosen.length ? "" : undefined}>
        <label
          className={styles.zone}
          htmlFor={inputId}
          data-dragging={dragging ? "" : undefined}
          data-filled={chosen.length ? "" : undefined}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className={styles.badge} aria-hidden="true">
            <Icon name={chosen.length ? "attachment" : "upload"} size="md" />
          </span>
          <Text as="span" role="bodyStrong">{strings.prompt}</Text>
          <Text as="span" role="label" tone="accent">{strings.browse}</Text>
          {strings.hint ? <Text as="span" role="label" tone="muted">{strings.hint}</Text> : null}
          <input
            ref={inputRef}
            className={styles.input}
            type="file"
            id={inputId}
            name={name}
            accept={accept}
            multiple={multiple}
            required={required}
            aria-describedby={chosen.length ? `${inputId}-state` : undefined}
            onChange={event => adopt(event.currentTarget.files)}
          />
        </label>
        {chosen.map((item, position) => (
          <ChosenPreview
            key={`${position}-${item.file.name}`}
            chosen={item}
            strings={strings}
            onRemove={() => discard(position)}
          />
        ))}
      </div>
      <Text as="p" role="label" tone="primary" dir="auto" id={`${inputId}-state`} live="status">
        {chosen.length ? strings.selected.replace("{name}", chosen.map(item => item.file.name).join(", ")) : null}
      </Text>
    </div>
  );
}
