"use client";

import { ConsequenceGroups, type ConsequenceGroup, type ConsequenceStrings } from "@/components/sections/planning-bulk/review-consequence-ledger/review-consequence-ledger";

export type LedgerFocus = {
  factoryName: string;
  factoryCode: string;
  mode: "manual" | "auto" | "excluded";
  inspectorName?: string;
  inPool?: boolean;
  packagePublished: boolean;
  windowSet: boolean;
  overlapEvaluated: boolean;
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
  bOverlap: string;
  bNotPool: string;
  bFail: string;
  bNone: string;
  checked: string;
  focusedFor: string;
};

const interp = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_unused, key) => String(values[key] ?? ""));

const verifiedFacts = (focus: LedgerFocus, s: EvidenceLedgerStrings): string[] => {
  const manual = focus.mode === "manual";
  return [
    manual && focus.inPool ? s.vRole : null,
    manual && focus.overlapEvaluated && focus.overlapCount === 0 ? s.vOverlap0 : null,
    focus.packagePublished ? s.vPkg : null,
  ].filter((fact): fact is string => fact !== null);
};

const notEvaluatedFacts = (focus: LedgerFocus, s: EvidenceLedgerStrings): string[] => [
  s.neList,
  focus.mode === "auto" ? s.neAuto : null,
  focus.windowSet ? null : s.neWindow,
].filter((fact): fact is string => fact !== null);

const blockingFacts = (focus: LedgerFocus, s: EvidenceLedgerStrings): string[] => {
  const manual = focus.mode === "manual";
  const sample = focus.overlapSamples[0];
  return [
    focus.overlapFailed ? s.bFail : null,
    manual && focus.inPool === false ? s.bNotPool : null,
    manual && focus.overlapEvaluated && focus.overlapCount > 0
      ? interp(s.bOverlap, { n: focus.overlapCount, label: sample?.label ?? "", window: sample?.window ?? "" })
      : null,
  ].filter((fact): fact is string => fact !== null);
};

const toRows = (facts: readonly string[], mark: ConsequenceGroup["rows"][number]["mark"]) =>
  facts.map((text, index) => ({ key: `${mark}-${index}`, mark, value: text, detail: "" }));

export default function EvidenceLedger({ focus, strings: s, ledgerStrings }: {
  focus: LedgerFocus | null;
  strings: EvidenceLedgerStrings;
  ledgerStrings: ConsequenceStrings;
}) {
  if (focus === null) {
    return (
      <ConsequenceGroups
        strings={ledgerStrings}
        groups={[{
          key: "none",
          heading: s.noneTitle,
          rows: [{ key: "none", mark: "pending", value: s.noneBody, detail: "" }],
        }]}
      />
    );
  }

  const verified = verifiedFacts(focus, s);
  const blocks = blockingFacts(focus, s);

  return (
    <ConsequenceGroups
      strings={ledgerStrings}
      label={interp(s.focusedFor, { name: focus.factoryName, code: focus.factoryCode })}
      groups={[
        {
          key: "verified", heading: s.cVerified,
          rows: verified.length ? toRows(verified, "ok") : toRows([s.bNone], "pending"),
        },
        { key: "notEvaluated", heading: s.cNotEval, rows: toRows(notEvaluatedFacts(focus, s), "pending") },
        {
          key: "blocks", heading: s.cBlocks,
          rows: blocks.length ? toRows(blocks, "blocked") : toRows([s.bNone], "ok"),
        },
        { key: "checked", heading: s.cChecked, negative: true, rows: toRows([s.checked], "pending") },
      ]}
    />
  );
}
