/**
 * Sample Details section from Visit Report · Results (Step 3 of 4).
 * Rows are local user-entered draft state until the report engine owns them;
 * the section never manufactures a sample row or a governed field value.
 */
"use client";

import { useId, useState } from "react";
import type { SamplesSectionStrings } from "./samplesSeizureStrings";

export type { SamplesSectionStrings };

type SampleDraft = {
  id: number;
  name: string;
  photoName: string;
};

function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>;
}

function CameraIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 6l1.5-2h5L16 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}

export default function SamplesSection({ strings }: { strings: SamplesSectionStrings }) {
  const inputPrefix = useId();
  const [gateAnswer, setGateAnswer] = useState<"yes" | "no" | null>(null);
  const [samples, setSamples] = useState<SampleDraft[]>([]);
  const [nextId, setNextId] = useState(1);

  function addSample() {
    setSamples(current => [...current, { id: nextId, name: "", photoName: "" }]);
    setNextId(current => current + 1);
  }

  return (
    <section className="samples-card" aria-labelledby={`${inputPrefix}-title`}>
      <h2 id={`${inputPrefix}-title`}>{strings.title}</h2>

      <div className="samples-gate" role="group" aria-labelledby={`${inputPrefix}-gate`}>
        <p id={`${inputPrefix}-gate`}>{strings.gate}</p>
        <div className="samples-options">
          <button type="button" aria-pressed={gateAnswer === "yes"} onClick={() => setGateAnswer("yes")}>
            <span className="samples-radio" aria-hidden="true" />
            {strings.gateYes}
          </button>
          <button type="button" aria-pressed={gateAnswer === "no"} onClick={() => setGateAnswer("no")}>
            <span className="samples-radio" aria-hidden="true" />
            {strings.gateNo}
          </button>
        </div>
      </div>

      {gateAnswer === "yes" && (
        <div className="samples-repeater">
          {samples.map((sample, index) => {
            const nameId = `${inputPrefix}-name-${sample.id}`;
            const photoId = `${inputPrefix}-photo-${sample.id}`;
            return (
              <div className="samples-row" key={sample.id}>
                <div className="samples-row-head">
                  <span className="badge badge-neutral">{strings.itemLabel} {index + 1}</span>
                  <button
                    type="button"
                    className="samples-delete"
                    aria-label={`${strings.deleteLabel} ${index + 1}`}
                    onClick={() => setSamples(current => current.filter(row => row.id !== sample.id))}
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div className="samples-fields">
                  <label className="samples-field" htmlFor={nameId}>
                    <span>{strings.nameLabel}</span>
                    <input
                      id={nameId}
                      className="input"
                      value={sample.name}
                      placeholder={strings.namePlaceholder}
                      onChange={event => setSamples(current => current.map(row => (
                        row.id === sample.id ? { ...row, name: event.target.value } : row
                      )))}
                    />
                  </label>

                  <div className="samples-field">
                    <span>{strings.photoFieldLabel}</span>
                    <label className="samples-photo" htmlFor={photoId}>
                      <CameraIcon />
                      {strings.takePhotoLabel}
                      <input
                        id={photoId}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        hidden
                        onChange={event => {
                          const photoName = event.target.files?.[0]?.name ?? "";
                          setSamples(current => current.map(row => (
                            row.id === sample.id ? { ...row, photoName } : row
                          )));
                        }}
                      />
                    </label>
                    {sample.photoName && <span className="samples-file numeric" dir="auto">{sample.photoName}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          <button type="button" className="samples-add" onClick={addSample}>
            <AddIcon />
            {strings.addCta}
          </button>
        </div>
      )}

      <style jsx>{`
        .samples-card {
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
        .samples-gate > p {
          margin: 0 0 8px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .samples-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-inline-size: 560px;
        }
        .samples-options button {
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
        .samples-options button[aria-pressed="true"] {
          border-color: var(--action-primary);
          background: var(--accent-soft);
        }
        .samples-radio {
          inline-size: 18px;
          block-size: 18px;
          flex: none;
          border: 2px solid var(--border-strong);
          border-radius: 50%;
        }
        .samples-options button[aria-pressed="true"] .samples-radio {
          border: 5px solid var(--action-primary);
          background: var(--surface-primary);
        }
        .samples-repeater {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-block-start: 14px;
        }
        .samples-row {
          padding: 14px 16px;
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          background: var(--surface-sunken);
        }
        .samples-row-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-block-end: 12px;
        }
        .samples-delete {
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
        .samples-delete:hover { background: var(--status-critical-soft); }
        .samples-delete svg, .samples-add svg, .samples-photo svg {
          inline-size: 16px;
          block-size: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
        }
        .samples-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .samples-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-inline-size: 0;
        }
        .samples-field > span:first-child {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .samples-field :global(.input) { min-block-size: 50px; }
        .samples-photo, .samples-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
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
        .samples-photo { align-self: flex-start; }
        .samples-add { inline-size: 100%; }
        .samples-photo:hover, .samples-add:hover { background: var(--surface-secondary); }
        .samples-file {
          overflow: hidden;
          color: var(--text-muted);
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 600px) {
          .samples-card { padding: 16px; }
          .samples-fields { grid-template-columns: minmax(0, 1fr); }
          .samples-photo { align-self: stretch; }
        }
      `}</style>
    </section>
  );
}
