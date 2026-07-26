/**
 * Sample Details section from Visit Report · Results (Step 3 of 4).
 *
 * DESIGN OF RECORD: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html,
 * card 2 (`.vr-card` → `t.sampleDetails`). That is the only authored Claude
 * design that contains this section; "SAQEEL PWA-Field Seizure Records.dc.html"
 * is a different, standalone screen (records 6 and 7) with no code behind it.
 *
 * Geometry is taken verbatim from `.vr-card` / `.vr-h` / `.vr-radios` /
 * `.vr-opt` / `.vr-ind` / `.vr-grid2` / `.fld` and the inline row styles. Every
 * control the design expresses as a design-system class (`btn btn-secondary
 * btn-sm`, `btn btn-ghost btn-icon btn-sm`, `btn btn-secondary btn-block`,
 * `input`, `badge badge-neutral`, `grow`) is rendered with that class rather
 * than re-implemented, so control heights follow --control-h-* exactly as the
 * design page resolves them.
 *
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

// Selected-gate glyph (`.vr-ind` child in the design). Visit Results draws the
// pressed indicator as a filled circle carrying a check; the design's bare #fff
// stroke is expressed here as the --text-on-action token.
function GateCheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="samples-check">
      <path d="m5 12 5 5 9-10" />
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
            <span className="samples-radio" aria-hidden="true">{gateAnswer === "yes" && <GateCheckIcon />}</span>
            {strings.gateYes}
          </button>
          <button type="button" aria-pressed={gateAnswer === "no"} onClick={() => setGateAnswer("no")}>
            <span className="samples-radio" aria-hidden="true">{gateAnswer === "no" && <GateCheckIcon />}</span>
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
                  <span className="grow" />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm samples-delete"
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

                  <div className="samples-photo-block">
                    <span className="samples-photo-label">{strings.photoFieldLabel}</span>
                    <label className="btn btn-secondary btn-sm samples-photo" htmlFor={photoId}>
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

          <button type="button" className="btn btn-secondary btn-block samples-add" onClick={addSample}>
            <AddIcon />
            {strings.addCta}
          </button>
        </div>
      )}

      <style jsx>{`
        /* .vr-card */
        .samples-card {
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
        .samples-gate > p {
          margin: 0 0 8px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        /* .vr-radios */
        .samples-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-inline-size: 560px;
        }
        /* .vr-opt */
        .samples-options button {
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
        .samples-options button[aria-pressed="true"] {
          border-color: var(--action-primary);
          background: var(--accent-soft);
        }
        /* .vr-ind */
        .samples-radio {
          display: grid;
          inline-size: 18px;
          block-size: 18px;
          flex: none;
          place-items: center;
          border: 2px solid var(--border-strong);
          border-radius: 50%;
        }
        .samples-options button[aria-pressed="true"] .samples-radio {
          border-color: var(--action-primary);
          background: var(--action-primary);
        }
        .samples-radio :global(.samples-check) {
          inline-size: 11px;
          block-size: 11px;
          fill: none;
          stroke: var(--text-on-action);
          stroke-width: 3;
        }
        /* The design draws one row at margin-block-start:14px and the add button
           at margin-block-start:12px. A column with gap:12px reproduces that and
           extends it to n rows without inventing a second spacing value. */
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
        /* The icons come from sibling components, so styled-jsx never stamps its
           scope class on them; without :global() these rules match nothing and
           the glyphs render at the UA default size with a solid fill. The design
           sets 15px inline, which is narrower than the canonical .btn svg rule's
           16px, so the scoped selector has to outrank it. */
        .samples-delete :global(svg), .samples-photo :global(svg) {
          inline-size: 15px;
          block-size: 15px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
        }
        .samples-delete { color: var(--status-critical-text); }
        .samples-add :global(svg) {
          inline-size: 16px;
          block-size: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
        }
        /* .vr-grid2 */
        .samples-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        /* .fld */
        .samples-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-inline-size: 0;
        }
        .samples-field > span:first-child {
          color: var(--text-secondary);
          font-size: 13px;
        }
        /* The photo cell is not a .fld in the design: a 13px label with
           margin-block-end:6px, then an intrinsic-width button. */
        .samples-photo-block { min-inline-size: 0; }
        .samples-photo-label {
          display: block;
          margin-block-end: 6px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .samples-photo { cursor: pointer; }
        .samples-file {
          display: block;
          overflow: hidden;
          margin-block-start: 6px;
          color: var(--text-muted);
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* Visit Results collapses .vr-grid2 at 700px. */
        @media (max-width: 700px) {
          .samples-fields { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
}
