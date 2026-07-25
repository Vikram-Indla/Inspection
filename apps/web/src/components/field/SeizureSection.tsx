/**
 * Seizure Details section from Visit Report · Results (Step 3 of 4).
 * This remains a report section, not a standalone route. Rows are empty until
 * explicitly added and contain only design-governed user-entry fields.
 */
"use client";

import { useId, useState } from "react";
import type { SeizureSectionStrings } from "./samplesSeizureStrings";

export type { SeizureSectionStrings };

type SeizureDraft = {
  id: number;
  productName: string;
  quantity: string;
};

function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
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
            <span className="seizure-radio" aria-hidden="true" />
            {strings.gateYes}
          </button>
          <button type="button" aria-pressed={gateAnswer === "no"} onClick={() => setGateAnswer("no")}>
            <span className="seizure-radio" aria-hidden="true" />
            {strings.gateNo}
          </button>
        </div>
      </div>

      {gateAnswer === "yes" && (
        <div className="seizure-repeater">
          {products.map((product, index) => {
            const productId = `${inputPrefix}-product-${product.id}`;
            const quantityId = `${inputPrefix}-quantity-${product.id}`;
            const rowLabel = strings.itemHeader.replace(/\d+/, String(index + 1));
            return (
              <div className="seizure-row" key={product.id}>
                <div className="seizure-row-head">
                  <span className="badge badge-neutral">{rowLabel}</span>
                  <button
                    type="button"
                    className="seizure-delete"
                    aria-label={`${strings.deleteLabel} ${index + 1}`}
                    onClick={() => setProducts(current => current.filter(row => row.id !== product.id))}
                  >
                    <TrashIcon />
                  </button>
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

          <button type="button" className="seizure-add" onClick={addProduct}>
            <AddIcon />
            {strings.addCta}
          </button>
        </div>
      )}

      <style jsx>{`
        .seizure-card {
          background: var(--surface-primary);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          box-shadow: var(--shadow-card);
          padding: 18px 19px;
        }
        h2 {
          margin: 0 0 14px;
          padding-block-end: 10px;
          border-block-end: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
        }
        .seizure-gate > p {
          margin: 0 0 8px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .seizure-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-inline-size: 560px;
        }
        .seizure-options button {
          display: flex;
          flex: 1 1 120px;
          align-items: center;
          gap: 9px;
          min-block-size: 50px;
          padding: 12px 14px;
          border: 1.5px solid var(--border-input);
          border-radius: 12px;
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
        .seizure-radio {
          inline-size: 18px;
          block-size: 18px;
          flex: none;
          border: 2px solid var(--border-strong);
          border-radius: 50%;
        }
        .seizure-options button[aria-pressed="true"] .seizure-radio {
          border: 5px solid var(--action-primary);
          background: var(--surface-primary);
        }
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
        .seizure-delete {
          display: grid;
          min-inline-size: 50px;
          min-block-size: 50px;
          margin-inline-start: auto;
          padding: 0;
          place-items: center;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: var(--status-critical-text);
          cursor: pointer;
        }
        .seizure-delete:hover { background: var(--status-critical-soft); }
        .seizure-delete svg, .seizure-add svg {
          inline-size: 16px;
          block-size: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
        }
        .seizure-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .seizure-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-inline-size: 0;
        }
        .seizure-field > span {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .seizure-field :global(.input) { min-block-size: 50px; }
        .seizure-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          inline-size: 100%;
          min-block-size: 50px;
          padding: 11px 15px;
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          background: var(--surface-primary);
          color: var(--text-primary);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
        }
        .seizure-add:hover { background: var(--surface-secondary); }
        @media (max-width: 600px) {
          .seizure-card { padding: 16px; }
          .seizure-fields { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
}
