import React from "react";
export function FileUpload({ label = "Add evidence", hint = "Photos or PDF, up to 20 MB", accept, multiple, onFiles, disabled }) {
  const ref = React.useRef(null);
  return (
    <button type="button" disabled={disabled} onClick={() => ref.current && ref.current.click()}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)",
        padding: "var(--space-5)", width: "100%", background: "var(--surface-secondary)",
        border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)",
        color: "var(--text-secondary)", cursor: "pointer", font: "inherit" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
      <span style={{ fontWeight: 500, fontSize: "var(--type-compact-size)" }}>{label}</span>
      <span className="t-caption">{hint}</span>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple}
        onChange={(e) => onFiles && onFiles(Array.from(e.target.files || []))} />
    </button>
  );
}