"use client";

/**
 * Visit Report · Results (Step 3 of 4) — client surface.
 * Design of record: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html
 *
 * Composition follows the design's five cards in order:
 *   1 Specialty Details · 2 Sample Details · 3 Seizure Details
 *   4 Documents Pending Review · 5 Inspector Notes
 * then the sticky action bar, then the post-submit success state.
 *
 * ZERO-ASSUMPTION RENDERING, three places it matters:
 *  · The three Yes/No gates are tri-state. null renders with NEITHER option
 *    pressed. The design ships a pressed value, but a stored NULL means the
 *    inspector has not answered and must not be shown as "No".
 *  · competent_department and pending_document_type are governed lookups. When
 *    the registry holds no values the select is disabled and reads
 *    "Not configured" — never the design's illustrative option copy.
 *  · The design's "Pending sync · 2" badge is not reproduced with a literal
 *    count. It reflects real unsaved local edits, or it does not render.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FieldConnectivityBanner from "@/components/field/FieldConnectivityBanner";
import styles from "./results.module.css";
import { saveResults, saveAndContinue, type ResultsDraft, type SampleRow, type SeizedRow } from "./actions";

export type LookupOption = { code: string; label: string };

export type ResultsStrings = {
  specDetails: string; needSpecVisit: string; competentDept: string; notes: string;
  sampleDetails: string; samplesTaken: string; sample: string; delete: string;
  sampleName: string; samplePhoto: string; takePhoto: string; addSample: string;
  seizureDetails: string; productsSeized: string; seizedProduct: string;
  productName: string; seizedProductName: string; quantity: string; addSeized: string;
  docsToReview: string; docType: string;
  inspectorNotes: string; enterNotes: string;
  yes: string; no: string;
  previous: string; submitReview: string; save: string; saving: string; saved: string;
  unsaved: string; notConfigured: string; selectPlaceholder: string;
  successTitle: string; successDesc: string; finalImmutable: string; backToTasks: string;
  immutableError: string; blockedError: string; signedOutError: string;
  connectivityOffline: string; connectivityWeak: string;
};

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>;
}
function AddIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>;
}
function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>;
}
function CameraIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" />
    </svg>
  );
}

/** The design's Yes/No pair. `value === null` leaves both unpressed. */
function Gate({
  prompt, value, onChange, yes, no, disabled, name,
}: {
  prompt: string; value: boolean | null; onChange: (v: boolean) => void;
  yes: string; no: string; disabled: boolean; name: string;
}) {
  return (
    <div role="group" aria-labelledby={`${name}-prompt`}>
      <p id={`${name}-prompt`} className={styles.gatePrompt}>{prompt}</p>
      <div className={styles.radios}>
        <button type="button" className={styles.opt} aria-pressed={value === true} disabled={disabled} onClick={() => onChange(true)}>
          <span className={styles.ind} aria-hidden="true">{value === true && <CheckIcon />}</span>{yes}
        </button>
        <button type="button" className={styles.opt} aria-pressed={value === false} disabled={disabled} onClick={() => onChange(false)}>
          <span className={styles.ind} aria-hidden="true">{value === false && <CheckIcon />}</span>{no}
        </button>
      </div>
    </div>
  );
}

/** Governed select. Empty registry → disabled and "Not configured". */
function GovernedSelect({
  id, label, required, value, options, onChange, disabled, s,
}: {
  id: string; label: string; required?: boolean; value: string | null;
  options: LookupOption[]; onChange: (v: string | null) => void; disabled: boolean; s: ResultsStrings;
}) {
  const unconfigured = options.length === 0;
  return (
    <label className={styles.fld} htmlFor={id}>
      <span>{label}{required && <> <span className={styles.req}>*</span></>}</span>
      <select
        id={id}
        className="select"
        disabled={disabled || unconfigured}
        value={value ?? ""}
        onChange={e => onChange(e.target.value || null)}
      >
        {unconfigured
          ? <option value="">{s.notConfigured}</option>
          : <>
              <option value="">{s.selectPlaceholder}</option>
              {options.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </>}
      </select>
    </label>
  );
}

export default function ResultsClient({
  inspectionId, reference, establishment, initial, departments, documentTypes, locked, backHref, tasksHref, s,
}: {
  inspectionId: string;
  reference: string;
  establishment: string | null;
  initial: ResultsDraft;
  departments: LookupOption[];
  documentTypes: LookupOption[];
  /** Inspection already past submission: the DB guard will refuse writes. */
  locked: boolean;
  backHref: string;
  tasksHref: string;
  s: ResultsStrings;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ResultsDraft>(initial);
  const [baseline, setBaseline] = useState<ResultsDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  const patch = (p: Partial<ResultsDraft>) => setDraft(d => ({ ...d, ...p }));

  function report(kind: string, message?: string) {
    if (kind === "immutable") return setError(s.immutableError);
    if (kind === "signed_out") return setError(s.signedOutError);
    if (kind === "blocked") return setError(`${s.blockedError} ${message ?? ""}`.trim());
    if (kind === "error") return setError(message ?? s.blockedError);
    setError(null);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveResults(inspectionId, draft);
      if (r.kind === "ok") { setBaseline(draft); setSavedAt(Date.now()); router.refresh(); }
      else report(r.kind, "message" in r ? r.message : undefined);
    });
  }

  // Step 3 → Step 4. Persist, then hand off to the Workspace, which owns the
  // submission ceremony (snapshot + idempotency key + acknowledgement through
  // the offline outbox). This screen never fabricates a submitted state.
  function onContinue() {
    setError(null);
    startTransition(async () => {
      const r = await saveAndContinue(inspectionId, draft);
      if (r.kind === "ok") { setBaseline(draft); router.push(backHref); }
      else report(r.kind, "message" in r ? r.message : undefined);
    });
  }

  // The design's success card, shown only when the inspection has genuinely
  // reached a submitted state — never as an optimistic post-click flash.
  if (locked) {
    return (
      <main className={styles.successOuter} data-screen-id="EXE-S17">
        <div className={styles.successCard}>
          <div className={styles.successMark}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
          </div>
          <h2 className={styles.successTitle}>{s.successTitle}</h2>
          <p className={`t-caption ${styles.successDesc}`}>{s.successDesc}</p>
          <div className={`id-code ${styles.successRef}`}>{reference} · {s.finalImmutable}</div>
          <a href={tasksHref} className="btn btn-primary btn-block">{s.backToTasks}</a>
        </div>
      </main>
    );
  }

  const disabled = locked || pending;

  return (
    <>
      <FieldConnectivityBanner offline={s.connectivityOffline} weak={s.connectivityWeak} />
      <main className={styles.wrap} data-screen-id="EXE-S15">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {/* 1 · Specialty Details */}
        <section className={styles.card} aria-labelledby="vr-spec">
          <h2 id="vr-spec" className={styles.cardTitle}>{s.specDetails}</h2>
          <div className={styles.cardStack}>
            <Gate
              name="vr-spec-gate" prompt={s.needSpecVisit} value={draft.specialty_visit_needed}
              onChange={v => patch({ specialty_visit_needed: v })} yes={s.yes} no={s.no} disabled={disabled}
            />
            <div className={styles.grid2}>
              <GovernedSelect
                id="vr-dept" label={s.competentDept} required s={s} disabled={disabled}
                value={draft.competent_department} options={departments}
                onChange={v => patch({ competent_department: v })}
              />
              <label className={styles.fld} htmlFor="vr-spec-notes">
                <span>{s.notes}</span>
                <textarea
                  id="vr-spec-notes" className="input" rows={2} disabled={disabled}
                  value={draft.specialty_notes ?? ""}
                  onChange={e => patch({ specialty_notes: e.target.value || null })}
                />
              </label>
            </div>
          </div>
        </section>

        {/* 2 · Sample Details */}
        <section className={styles.card} aria-labelledby="vr-samples">
          <h2 id="vr-samples" className={styles.cardTitle}>{s.sampleDetails}</h2>
          <Gate
            name="vr-samples-gate" prompt={s.samplesTaken} value={draft.samples_taken}
            onChange={v => patch({ samples_taken: v })} yes={s.yes} no={s.no} disabled={disabled}
          />
          {draft.samples_taken === true && (
            <div className={styles.repeater}>
              {draft.samples.map((row, i) => (
                <div className={styles.row} key={row.id ?? `new-${i}`}>
                  <div className={styles.rowHead}>
                    <span className="badge badge-neutral">{s.sample} {i + 1}</span>
                    <span className={styles.grow} />
                    <button
                      type="button" className={`btn btn-ghost btn-icon btn-sm ${styles.rowDelete}`}
                      aria-label={`${s.delete} ${i + 1}`} disabled={disabled}
                      onClick={() => patch({ samples: draft.samples.filter((_, j) => j !== i) })}
                    ><TrashIcon /></button>
                  </div>
                  <div className={styles.grid2}>
                    <label className={styles.fld} htmlFor={`vr-sample-name-${i}`}>
                      <span>{s.sampleName}</span>
                      <input
                        id={`vr-sample-name-${i}`} className="input" placeholder={s.sampleName}
                        disabled={disabled} value={row.sample_name ?? ""}
                        onChange={e => patch({
                          samples: draft.samples.map((r, j) => j === i ? { ...r, sample_name: e.target.value } : r),
                        })}
                      />
                    </label>
                    {/* Capture affordance only. The photo becomes an evidence row
                        (linked_type='visit_result_sample', added in
                        20260726041955) once the evidence upload path is wired;
                        it is deliberately not faked as stored here. */}
                    <div className={styles.photoBlock}>
                      <span className={styles.photoLabel}>{s.samplePhoto}</span>
                      <button type="button" className={`btn btn-secondary btn-sm ${styles.photoBtn}`} disabled>
                        <CameraIcon />{s.takePhoto}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button" className={`btn btn-secondary btn-block ${styles.addBtn}`} disabled={disabled}
                onClick={() => patch({ samples: [...draft.samples, { ordinal: draft.samples.length + 1, sample_name: "" }] as SampleRow[] })}
              ><AddIcon />{s.addSample}</button>
            </div>
          )}
        </section>

        {/* 3 · Seizure Details */}
        <section className={styles.card} aria-labelledby="vr-seizure">
          <h2 id="vr-seizure" className={styles.cardTitle}>{s.seizureDetails}</h2>
          <Gate
            name="vr-seizure-gate" prompt={s.productsSeized} value={draft.products_seized}
            onChange={v => patch({ products_seized: v })} yes={s.yes} no={s.no} disabled={disabled}
          />
          {draft.products_seized === true && (
            <div className={styles.repeater}>
              {draft.seized.map((row, i) => (
                <div className={styles.row} key={row.id ?? `new-${i}`}>
                  <div className={styles.rowHead}>
                    <span className="badge badge-neutral">{s.seizedProduct} {i + 1}</span>
                    <span className={styles.grow} />
                    <button
                      type="button" className={`btn btn-ghost btn-icon btn-sm ${styles.rowDelete}`}
                      aria-label={`${s.delete} ${i + 1}`} disabled={disabled}
                      onClick={() => patch({ seized: draft.seized.filter((_, j) => j !== i) })}
                    ><TrashIcon /></button>
                  </div>
                  <div className={styles.grid2}>
                    <label className={styles.fld} htmlFor={`vr-seized-name-${i}`}>
                      <span>{s.productName}</span>
                      <input
                        id={`vr-seized-name-${i}`} className="input" placeholder={s.seizedProductName}
                        disabled={disabled} value={row.product_name ?? ""}
                        onChange={e => patch({
                          seized: draft.seized.map((r, j) => j === i ? { ...r, product_name: e.target.value } : r),
                        })}
                      />
                    </label>
                    <label className={styles.fld} htmlFor={`vr-seized-qty-${i}`}>
                      <span>{s.quantity}</span>
                      <input
                        id={`vr-seized-qty-${i}`} className="input" placeholder={s.quantity}
                        disabled={disabled} value={row.quantity ?? ""}
                        onChange={e => patch({
                          seized: draft.seized.map((r, j) => j === i ? { ...r, quantity: e.target.value } : r),
                        })}
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button" className={`btn btn-secondary btn-block ${styles.addBtn}`} disabled={disabled}
                onClick={() => patch({ seized: [...draft.seized, { ordinal: draft.seized.length + 1, product_name: "", quantity: "" }] as SeizedRow[] })}
              ><AddIcon />{s.addSeized}</button>
            </div>
          )}
        </section>

        {/* 4 · Documents Pending Review */}
        <section className={styles.card} aria-labelledby="vr-docs">
          <h2 id="vr-docs" className={styles.cardTitle}>{s.docsToReview}</h2>
          <GovernedSelect
            id="vr-doctype" label={s.docType} required s={s} disabled={disabled}
            value={draft.pending_document_type} options={documentTypes}
            onChange={v => patch({ pending_document_type: v })}
          />
        </section>

        {/* 5 · Inspector Notes */}
        <section className={styles.card} aria-labelledby="vr-notes">
          <h2 id="vr-notes" className={styles.cardTitle}>{s.inspectorNotes}</h2>
          <textarea
            className="input" rows={4} placeholder={s.enterNotes} aria-label={s.inspectorNotes}
            disabled={disabled} value={draft.inspector_notes ?? ""}
            onChange={e => patch({ inspector_notes: e.target.value || null })}
          />
        </section>
      </main>

      <div className={styles.actionBar}>
        {/* Real state, not the design's literal "· 2". */}
        {dirty
          ? <span className="badge badge-warning"><span className="dot" />{s.unsaved}</span>
          : savedAt !== null
            ? <span className="badge badge-neutral">{s.saved}</span>
            : null}
        <span className={styles.grow} />
        <a href={backHref} className="btn btn-secondary">{s.previous}</a>
        <button type="button" className="btn btn-secondary" disabled={disabled || !dirty} onClick={onSave}>
          {pending ? s.saving : s.save}
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={onContinue}>
          {s.submitReview}
        </button>
      </div>
    </>
  );
}
