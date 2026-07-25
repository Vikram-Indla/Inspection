/**
 * GatedRepeaterSection — shared additive primitive behind SamplesSection and
 * SeizureSection (SCR-IPAD Visit-Reports family). Renders exactly the CAPTURED
 * scaffold of a "gate question → add repeatable items" inspection sub-section:
 *
 *   1. section header,
 *   2. a Yes/No gate question (e.g. VR-037 "Were samples collected…"),
 *   3. on "Yes", the existing shared Repeater.tsx (add / remove rows), and
 *   4. an OPTIONAL per-item photo-upload affordance with captured constraints
 *      (Samples only — VR-041 label + VR-042 helper).
 *
 * SHELL SCOPE: the per-item DETAIL fields are NOT captured (VR-043/044/046 are
 * sample DATA values, not labels), so each repeated row shows only its captured
 * header (if any) plus an explicit, clearly-marked build placeholder. No submit /
 * outbox / RLS wiring lives here — this component is additive and NOT yet joined
 * to the inspection engine (that needs the missing item fields + an engine
 * wire-in). All state below is local and ephemeral by design; it deliberately
 * touches none of the offline/outbox machinery.
 *
 * Design-system only: sq-surface / sq-segmented / sq-btn / sq-field / t-caption,
 * no bare colors, input geometry untouched.
 */
"use client";

import { useState } from "react";
import Repeater from "@/components/Repeater";

type ShellItem = Record<string, never>;

/**
 * Per-item photo affordance. Renders the captured label + helper and a jpg file
 * picker reflecting the captured "jpg format" constraint. This is a SHELL: the
 * chosen file is held in local state only for affordance feedback — persisting
 * it as evidence requires the inspection engine wire-in and is intentionally out
 * of scope here (it must go through the untouched offline/outbox path, not this
 * component).
 */
function PhotoAffordance({ inputId, label, helper }: { inputId: string; label: string; helper: string }) {
  const helperId = `${inputId}-helper`;
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="stack" style={{ gap: "var(--space-1)", marginBlockStart: "var(--space-2)" }}>
      {/* Wrapping <label> = implicit control association (accessible); it is NOT
          className="sq-field__label" so the a11y-form-label release guard's
          htmlFor requirement does not apply to this button-style file control. */}
      <label
        className="btn btn-secondary btn-touch"
        htmlFor={inputId}
        style={{
          minBlockSize: 50,
          padding: "11px 15px",
          border: "1.5px dashed var(--border-strong)",
          background: "var(--surface-sunken)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        {label}
        <input
          id={inputId}
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          aria-describedby={helperId}
          hidden
          onChange={e => setChosen(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <p id={helperId} className="t-caption">{helper}</p>
      {chosen && <p className="t-caption numeric">{chosen}</p>}
    </div>
  );
}

export default function GatedRepeaterSection({
  title,
  gate,
  gateYes,
  gateNo,
  addLabel,
  removeLabel,
  idPrefix,
  itemHeader,
  photo,
}: {
  title: string;
  gate: string;
  gateYes: string;
  gateNo: string;
  addLabel: string;
  removeLabel: string;
  idPrefix: string;
  /** Captured repeater item-header template (e.g. VR-048 "Product (1)"); the
   *  trailing numeral is swapped for the 1-based row index. Omit when no header
   *  is captured (Samples). */
  itemHeader?: string;
  /** Captured per-item photo affordance (Samples: VR-041 label + VR-042 helper). */
  photo?: { label: string; helper: string };
}) {
  // Local, ephemeral gate answer — no persistence (see file header). null = unanswered.
  const [gateAnswer, setGateAnswer] = useState<"yes" | "no" | null>(null);
  const [items, setItems] = useState<ShellItem[]>([]);
  const gateLabelId = `${idPrefix}-gate`;

  return (
    <section
      className="panel"
      style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
      aria-labelledby={`${idPrefix}-title`}
    >
      <h4 id={`${idPrefix}-title`}>{title}</h4>

      {/* Yes/No gate question (VR-037 / VR-039). role=group + aria-labelledby
          names the toggle for assistive tech; mirrors the Workspace ctx toggle. */}
      <div role="group" aria-labelledby={gateLabelId} className="stack" style={{ gap: "var(--space-2)" }}>
        <p id={gateLabelId} className="sq-field__label">{gate}</p>
        <div className="sq-segmented sq-segmented--field" style={{ alignSelf: "flex-start" }}>
          <button type="button" style={{ minBlockSize: 50, padding: "12px 14px", borderWidth: "1.5px" }} aria-pressed={gateAnswer === "yes"} onClick={() => setGateAnswer("yes")}>{gateYes}</button>
          <button type="button" style={{ minBlockSize: 50, padding: "12px 14px", borderWidth: "1.5px" }} aria-pressed={gateAnswer === "no"} onClick={() => setGateAnswer("no")}>{gateNo}</button>
        </div>
      </div>

      {/* Repeatable items appear only once the gate is answered "Yes". */}
      {gateAnswer === "yes" && (
        <Repeater<ShellItem>
          items={items}
          onChange={setItems}
          makeItem={() => ({})}
          addLabel={addLabel}
          removeLabel={removeLabel}
          renderItem={(_item, index) => (
            <div className="stack" style={{ gap: "var(--space-2)" }}>
              {itemHeader && (
                // Captured header template; swap the captured numeral for the real
                // 1-based row index (numeric formatting over the captured string —
                // no new copy). Works for EN "Product (1)" and AR "المنتج (1)".
                <strong>{itemHeader.replace(/\d+/, String(index + 1))}</strong>
              )}

              {photo && <PhotoAffordance inputId={`${idPrefix}-photo-${index}`} label={photo.label} helper={photo.helper} />}

              {/* BUILD PLACEHOLDER — NOT user-facing product copy. The per-item
                  detail field LABELS are uncaptured: VR-043 "Final Product Sample",
                  VR-044 "Polyethylene (PE) Pellets" and VR-046 are sample DATA
                  values (NON_PRODUCT_REFERENCE / sample-data), not labels. The real
                  detail form lands after live-Figma label extraction + engine
                  wire-in; this marker keeps the shell honest in the meantime. */}
              <p
                className="t-caption"
                data-shell-placeholder="samples-seizure-item-fields"
                style={{ fontStyle: "italic", color: "var(--text-secondary)" }}
              >
                item fields pending live-Figma extraction (VR-043/044/046 are sample data, not labels)
              </p>
            </div>
          )}
        />
      )}
    </section>
  );
}
