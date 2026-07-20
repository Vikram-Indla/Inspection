"use client";

// F360-PERM-005 · F360-ACT-003 — the button is rendered only after the
// server-side permission check. Browser print-to-PDF is the platform's
// existing sanctioned PDF path and preserves the permission-filtered DOM.
export default function Factory360ExportButton({ label }: { label: string }) {
  return <button className="btn btn-secondary btn-touch" type="button" onClick={() => window.print()}>{label}</button>;
}
