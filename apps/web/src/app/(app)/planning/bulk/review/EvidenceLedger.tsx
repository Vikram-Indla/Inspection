"use client";
// CD-024 / SCR-WEB-140 / P02 — Assignment Evidence Ledger.
//
// The ONE signature pattern of this screen. Four TRUTH CLASSES for the focused
// candidate/method, fed ENTIRELY by loadBulkSelection facts + a static truth
// config. There is deliberately NO score, rank, badge, confidence or freshness
// number here: the only numbers shown are evidence facts (how many overlapping
// visits a query actually returned), never a rating of a person.
//
//   Verified now            — facts we HAVE, each citing the check that produced it
//   Not evaluated           — named absences (no Saqeel source), never a false zero
//   Blocks assignment       — a fact that prevents this pick (exact visit + window)
//   Checked again before publish — the pre-write re-validation gate (R1-1 truth:
//                             the atomic RPC itself re-validates nothing)
//
// A11y: each class is a labelled heading so a screen-reader user can navigate the
// classes directly; the whole region reflects the row currently focused in the
// candidate table (focusin) or opened via an explicit "Review evidence" control.

export type LedgerFocus = {
  factoryName: string;
  factoryCode: string;
  mode: "manual" | "auto" | "excluded";
  inspectorName?: string;
  /** manual pick present in the eligible Inspector pool (undefined when auto). */
  inPool?: boolean;
  packagePublished: boolean;
  windowSet: boolean;
  /** window set AND the overlap source returned ok. */
  overlapEvaluated: boolean;
  /** overlap source read failed — fail closed, never "no conflict". */
  overlapFailed: boolean;
  overlapCount: number;
  overlapSamples: { label: string; window: string }[];
};

export type EvidenceLedgerStrings = {
  noneTitle: string;
  noneBody: string;
  cVerified: string;
  cNotEval: string;
  cBlocks: string;
  cChecked: string;
  vRole: string;
  vOverlap0: string;
  vPkg: string;
  neList: string;
  neAuto: string;
  neWindow: string;
  bOverlap: string;   // interp {label} {window} {n}
  bNotPool: string;
  bFail: string;
  bNone: string;
  checked: string;
  focusedFor: string; // interp {name} {code}
};

const interp = (tpl: string, map: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(map[k] ?? ""));

type Mark = "ok" | "blocked" | "pending";
function LRow({ mark, text }: { mark: Mark; text: string }) {
  const glyph = mark === "ok" ? "✓" : mark === "blocked" ? "✕" : "○";
  return (
    <div className="cd-lrow">
      <span className={`cd-lrow__mark ${mark}`} aria-hidden="true">{glyph}</span>
      <div className="cd-lrow__body"><div className="cd-lrow__d" style={{ color: "var(--text-primary)" }}>{text}</div></div>
    </div>
  );
}

export default function EvidenceLedger({ focus, strings: s }: { focus: LedgerFocus | null; strings: EvidenceLedgerStrings }) {
  if (!focus) {
    return (
      <div className="cd-lgroup" role="group" aria-label={s.noneTitle}>
        <div className="cd-lgroup__head">{s.noneTitle}</div>
        <p className="t-caption" style={{ margin: 0 }}>{s.noneBody}</p>
      </div>
    );
  }

  const manual = focus.mode === "manual";

  // ── Verified now — only facts a real check produced ──────────────────────
  const verified: string[] = [];
  if (manual && focus.inPool) verified.push(s.vRole);
  if (manual && focus.overlapEvaluated && focus.overlapCount === 0) verified.push(s.vOverlap0);
  if (focus.packagePublished) verified.push(s.vPkg);

  // ── Not evaluated — named absences (no Saqeel source) ────────────────────
  const notEval: string[] = [s.neList];
  if (focus.mode === "auto") notEval.push(s.neAuto);
  if (!focus.windowSet) notEval.push(s.neWindow);

  // ── Blocks assignment — facts preventing this pick ───────────────────────
  const blocks: string[] = [];
  if (focus.overlapFailed) blocks.push(s.bFail);
  if (manual && focus.inPool === false) blocks.push(s.bNotPool);
  if (manual && focus.overlapEvaluated && focus.overlapCount > 0) {
    const sample = focus.overlapSamples[0];
    blocks.push(interp(s.bOverlap, { n: focus.overlapCount, label: sample?.label ?? "", window: sample?.window ?? "" }));
  }

  return (
    <div
      role="region"
      aria-label={interp(s.focusedFor, { name: focus.factoryName, code: focus.factoryCode })}
      className="cd-ledger"
    >
      <div className="cd-lgroup" role="group" aria-labelledby="cd-ev-verified">
        <div className="cd-lgroup__head" id="cd-ev-verified">{s.cVerified}</div>
        {verified.length ? verified.map((t, i) => <LRow key={i} mark="ok" text={t} />) : <LRow mark="pending" text={s.bNone} />}
      </div>
      <div className="cd-lgroup" role="group" aria-labelledby="cd-ev-noteval">
        <div className="cd-lgroup__head" id="cd-ev-noteval">{s.cNotEval}</div>
        {notEval.map((t, i) => <LRow key={i} mark="pending" text={t} />)}
      </div>
      <div className="cd-lgroup" role="group" aria-labelledby="cd-ev-blocks">
        <div className="cd-lgroup__head" id="cd-ev-blocks">{s.cBlocks}</div>
        {blocks.length ? blocks.map((t, i) => <LRow key={i} mark="blocked" text={t} />) : <LRow mark="ok" text={s.bNone} />}
      </div>
      <div className="cd-lgroup cd-lgroup--not" role="group" aria-labelledby="cd-ev-checked">
        <div className="cd-lgroup__head" id="cd-ev-checked">{s.cChecked}</div>
        <LRow mark="pending" text={s.checked} />
      </div>
    </div>
  );
}
