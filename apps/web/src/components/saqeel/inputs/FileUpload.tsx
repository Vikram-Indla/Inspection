"use client";
import React from "react";

export interface FileUploadProps {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles?: (files: File[]) => void;
}

export function FileUpload({
  label = "Add evidence",
  hint = "Photos or PDF, up to 20 MB",
  accept,
  multiple,
  onFiles,
  disabled,
}: FileUploadProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      className="fileupload"
      disabled={disabled}
      onClick={() => ref.current && ref.current.click()}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
      <span className="fileupload-label">{label}</span>
      <span className="t-caption">{hint}</span>
      <input
        ref={ref}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFiles && onFiles(Array.from(e.target.files || []))}
      />
    </button>
  );
}
