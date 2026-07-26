/**
 * Seizure Details section from Visit Report · Results (Step 3 of 4).
 *
 * DESIGN OF RECORD: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html,
 * card 3 (`.vr-card` → `t.seizureDetails`). "SAQEEL PWA-Field Seizure
 * Records.dc.html" is a different, standalone screen (records 6 and 7) and is
 * not what this section renders.
 *
 * Geometry is taken verbatim from `.vr-card` / `.vr-h` / `.vr-radios` /
 * `.vr-opt` / `.vr-ind` / `.vr-grid2` / `.fld` and the inline row styles, and
 * every control the design expresses as a design-system class is rendered with
 * that class rather than re-implemented.
 *
 * NOTE — no per-row delete control. The samples row in the same design carries
 * `btn btn-ghost btn-icon btn-sm` next to its badge; the seizure row carries the
 * badge alone. The requirements baseline is silent on seizure entirely (zero of
 * the 478 rows mention a sample or a seizure), so the design is the governing
 * authority and it does not grant a remove affordance here. Flagged for the
 * product owner rather than mirrored across from samples.
 *
 * This remains a report section, not a standalone route. Rows are empty until
 * explicitly added and contain only design-governed user-entry fields.
 */
"use client";

import { useId, useState } from "react";
import { seizureItemHeader, type SeizureSectionStrings } from "./samplesSeizureStrings";

export type { SeizureSectionStrings };

type SeizureDraft = {
  id: number;
  productName: string;
  quantity: string;
};

function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
}

// Selected-gate glyph (`.vr-ind` child in the design). Visit Results draws the
// pressed indicator as a filled circle carrying a check; the design's bare #fff
// stroke is expressed here as the --text-on-action token.
function GateCheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="seizure-check">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export default function SeizureSection({ strings }: { strings: SeizureSectionStrings }) {
  const inputPrefix = useId();
  const [gateAnswer, setGateAnswer] = useState<"yes" | "no" | null>(null);
  const [products, setProducts] = useState<SeizureDraft[]>([]);
  const [nextId, setNextId] = useState(1);

  function addProduct() {
    setProducts(current => [...current, { id: nextId, productName: "", quantity: "" }]);
    setNextId(current => current + 1);
  }

  return (
    <section className="seizure-card" aria-labelledby={`${inputPrefix}-title`}>
      <h2 id={`${inputPrefix}-title`}>{strings.title}</h2>

      <div className="seizure-gate" role="group" aria-labelledby={`${inputPrefix}-gate`}>
        <p id={`${inputPrefix}-gate`}>{strings.gate}</p>
        <div className="seizure-options">
          <button type="button" aria-pressed={gateAnswer === "yes"} onClick={() => setGateAnswer("yes")}>
            <span className="seizure-radio" aria-hidden="true">{gateAnswer === "yes" && <GateCheckIcon />}</span>
            {strings.gateYes}
          </button>
          <button type="button" aria-pressed={gateAnswer === "no"} onClick={() => setGateAnswer("no")}>
            <span className="seizure-radio" aria-hidden="true">{gateAnswer === "no" && <GateCheckIcon />}</span>
            {strings.gateNo}
          </button>
        </div>
      </div>

      {gateAnswer === "yes" && (
        <div className="seizure-repeater">
          {products.map((product, index) => {
            const productId = `${inputPrefix}-product-${product.id}`;
            const quantityId = `${inputPrefix}-quantity-${product.id}`;
            return (
              <div className="seizure-row" key={product.id}>
                <div className="seizure-row-head">
                  <span className="badge badge-neutral">{seizureItemHeader(strings.itemHeader, index + 1)}</span>
                </div>

                <div className="seizure-fields">
                  <label className="seizure-field" htmlFor={productId}>
                    <span>{strings.productNameLabel}</span>
                    <input
                      id={productId}
                      className="input"
                      value={product.productName}
                      placeholder={strings.productNamePlaceholder}
                      onChange={event => setProducts(current => current.map(row => (
                        row.id === product.id ? { ...row, productName: event.target.value } : row
                      )))}
                    />
                  </label>
                  <label className="seizure-field" htmlFor={quantityId}>
                    <span>{strings.quantityLabel}</span>
                    <input
                      id={quantityId}
                      className="input"
                      inputMode="decimal"
                      value={product.quantity}
                      placeholder={strings.quantityPlaceholder}
                      onChange={event => setProducts(current => current.map(row => (
                        row.id === product.id ? { ...row, quantity: event.target.value } : row
                      )))}
                    />
                  </label>
                </div>
              </div>
            );
          })}

          <button type="button" className="btn btn-secondary btn-block seizure-add" onClick={addProduct}>
            <AddIcon />
            {strings.addCta}
          </button>
        </div>
      )}

      <style jsx>{`
        /* .vr-card */
        .seizure-card {
          background: var(--surface-primary);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          box-shadow: var(--shadow-card);
          padding: 18px 19px;
        }
        /* .vr-h */
        h2 {
          margin: 0 0 14px;
          padding-block-end: 10px;
          border-block-end: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
        }
        /* gate prompt: 13px / --text-secondary / margin-block-end 8px */
        .seizure-gate > p {
          margin: 0 0 8px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        /* .vr-radios */
        .seizure-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-inline-size: 560px;
        }
        /* .vr-opt */
        .seizure-options button {
          display: flex;
          flex: 1 1 120px;
          align-items: center;
          gap: 9px;
          min-block-size: 50px;
          padding: 12px 14px;
          border: 1.5px solid var(--border-input);
          border-radius: var(--radius-md);
          background: var(--surface-primary);
          color: var(--text-primary);
          cursor: pointer;
          font: inherit;
          text-align: start;
        }
        .seizure-options button[aria-pressed="true"] {
          border-color: var(--action-primary);
          background: var(--accent-soft);
        }
        /* .vr-ind */
        .seizure-radio {
          display: grid;
          inline-size: 18px;
          block-size: 18px;
          flex: none;
          place-items: center;
          border: 2px solid var(--border-strong);
          border-radius: 50%;
        }
        .seizure-options button[aria-pressed="true"] .seizure-radio {
          border-color: var(--action-primary);
          background: var(--action-primary);
        }
        .seizure-radio :global(.seizure-check) {
          inline-size: 11px;
          block-size: 11px;
          fill: none;
          stroke: var(--text-on-action);
          stroke-width: 3;
        }
        /* The design draws one row at margin-block-start:14px and the add button
           at margin-block-start:12px. A column with gap:12px reproduces that and
           extends it to n rows without inventing a second spacing value. */
        .seizure-repeater {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-block-start: 14px;
        }
        .seizure-row {
          padding: 14px 16px;
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          background: var(--surface-sunken);
        }
        .seizure-row-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-block-end: 12px;
        }
        /* The icon comes from a sibling component, so styled-jsx never stamps
           its scope class on it; without :global() this rule matches nothing. */
        .seizure-add :global(svg) {
          inline-size: 16px;
          block-size: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
        }
        /* .vr-grid2 */
        .seizure-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        /* .fld */
        .seizure-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-inline-size: 0;
        }
        .seizure-field > span {
          color: var(--text-secondary);
          font-size: 13px;
        }
        /* Visit Results collapses .vr-grid2 at 700px. */
        @media (max-width: 700px) {
          .seizure-fields { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
}
