import { Overline, Text } from "@/components/saqeel/type";
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { latestVersionNumber } from "./stale-check";

const STALE_POLL_MS = 45_000;

// CD-030 / SCR-WEB-320 — Version Comparison, route-neutral compare mode inside
// /reviews/:id. The signature interaction is the Tamper-evident Scope Rail: it
// classifies every changed answer against the review's STORED returned scope
// (reviews.returned_sections) — never inferred from the diff itself. Categories:
//   expected     — changed inside the returned scope (the inspector was asked to)
//   unexpected   — changed OUTSIDE the returned scope (a locked-section change / tamper)
//   unchanged    — identical across the two versions
//   unavailable  — cannot be classified (no returned scope on record, or the
//                  answer maps to no known section). NEVER downgraded to "unchanged".
// Comparison is navigation-only: selecting a rail row scrolls to the diff row.
// There is no accept/merge action (HANDOFF_BLOCKED_ACCEPT). Evidence/media,
// package-semantic and metadata/section-order comparisons are not derived in the
// runtime and are shown explicitly unavailable, never "unchanged"
// (HANDOFF_BLOCKED_MEDIADIFF / _PKGSEMANTIC / _METADIFF).

export type SnapshotCollectionItem = { id?: string; sha256?: string; [key: string]: unknown };
export type CompareVersion = {
  n: number;
  answers: Record<string, string>;
  evidence: SnapshotCollectionItem[] | null;
  actionForms: SnapshotCollectionItem[] | null;
};
export type ItemSection = Record<string, { key: string; title: string }>;

export type VersionCompareStrings = {
  heading: string;
  scopeSource: string;          // "Returned scope authority: {label}"
  noScope: string;              // no returned scope on record
  from: string; to: string;
  colItem: string; colSection: string; colClass: string;
  catExpected: string; catUnexpected: string; catUnchanged: string; catUnavailable: string;
  tamperTitle: string; tamperBody: string;
  cleanTitle: string; cleanBody: string;
  noPrior: string;
  emptyDiff: string;
  navHint: string;
  unavailableHeading: string;
  unavailEvidence: string; unavailPackage: string; unavailMetadata: string;
  unavailNote: string;
  collectionHeading: string; evidenceCollection: string; actionCollection: string;
  added: string; removed: string; changed: string; collectionUnavailable: string;
  enumLabels: Record<string, string>;   // stored answer value -> translated label
  // S08-stale (STATE_MATRIX_CD-030.csv) — optional so this can ship ahead of a
  // page.tsx string-table wire-up; EN-only fallback text is used when absent.
  staleTitle?: string; staleBody?: string; staleRefresh?: string;
};

type Category = "expected" | "unexpected" | "unchanged" | "unavailable";
const GLYPH: Record<Category, string> = { expected: "✔", unexpected: "▲", unchanged: "=", unavailable: "○" };
const LOZ: Record<Category, string> = {
  expected: "sq-lozenge sq-lozenge--success",
  unexpected: "sq-lozenge sq-lozenge--critical",
  unchanged: "sq-lozenge",
  unavailable: "sq-lozenge sq-lozenge--warning",
};

export default function VersionCompare({ versions, itemSection, returnedScope, scopeLabel, strings }: {
  versions: CompareVersion[];          // sorted newest-first
  itemSection: ItemSection;            // answer-key -> owning section
  returnedScope: string[] | null;      // stored section keys; null when no return on record
  scopeLabel: string | null;           // human label of the return that set the scope
  strings: VersionCompareStrings;
}) {
  const numbers = versions.map(v => v.n);
  const latest = numbers[0];
  const prior = numbers[1];
  const [toN, setToN] = useState<number>(latest);
  const [fromN, setFromN] = useState<number | undefined>(prior);
  const [open, setOpen] = useState<Record<Category, boolean>>({ expected: true, unexpected: true, unchanged: false, unavailable: true });
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [staleAt, setStaleAt] = useState<number | null>(null);

  // S08-stale — poll for a version submitted after this surface loaded. Never
  // invents a freshness threshold beyond "a higher version number now exists
  // on record" (HANDOFF_BLOCKED-free: this is a real, verifiable DB read, not
  // a guessed staleness window). Resets once `versions` itself refreshes past
  // the version that was flagged (i.e. a real refetch happened, not a timer).
  useEffect(() => {
    setStaleAt(null);
    const id = params?.id;
    if (!id) return;
    const check = () => {
      latestVersionNumber(id).then(n => {
        if (n != null && n > latest) setStaleAt(n);
      }).catch(() => { /* transient poll failure — not a state to surface, next tick retries */ });
    };
    const timer = setInterval(check, STALE_POLL_MS);
    return () => clearInterval(timer);
  }, [params?.id, latest]);

  const from = versions.find(v => v.n === fromN);
  const to = versions.find(v => v.n === toN);

  const rows = useMemo(() => {
    if (!from || !to) return [];
    const keys = Array.from(new Set([...Object.keys(from.answers), ...Object.keys(to.answers)])).sort();
    return keys.map(k => {
      const a = from.answers[k];
      const b = to.answers[k];
      const changed = a !== b;
      const sect = itemSection[k];
      let category: Category;
      if (!changed) {
        category = "unchanged";
      } else if (returnedScope == null || !sect) {
        // Scope cannot be established for this change — never call it "unchanged".
        category = "unavailable";
      } else {
        category = returnedScope.includes(sect.key) ? "expected" : "unexpected";
      }
      return { key: k, prev: a, latest: b, changed, section: sect, category };
    });
  }, [from, to, itemSection, returnedScope]);

  const counts: Record<Category, number> = { expected: 0, unexpected: 0, unchanged: 0, unavailable: 0 };
  rows.forEach(r => { counts[r.category] += 1; });
  const changedRows = rows.filter(r => r.changed);
  const tamper = counts.unexpected > 0;
  const scopeKnown = returnedScope != null;

  function goToRow(key: string) {
    const el = rowRefs.current[key];
    if (el) { el.scrollIntoView({ block: "center", behavior: "auto" }); el.focus(); }
  }

  const categories: Category[] = ["unexpected", "expected", "unavailable", "unchanged"];
  const collectionDiff = (a: SnapshotCollectionItem[] | null | undefined, b: SnapshotCollectionItem[] | null | undefined) => {
    if (!a || !b) return null;
    if ([...a, ...b].some(item => typeof item.id !== "string" || !item.id)) return null;
    const canonical = (value: unknown): string => {
      if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
      }
      return JSON.stringify(value);
    };
    const left = new Map(a.map(item => [String(item.id), item]));
    const right = new Map(b.map(item => [String(item.id), item]));
    const added = [...right.keys()].filter(id => !left.has(id)).sort();
    const removed = [...left.keys()].filter(id => !right.has(id)).sort();
    const changed = [...right.keys()].filter(id => left.has(id)
      && canonical(left.get(id)) !== canonical(right.get(id))).sort();
    return {
      empty: left.size === 0 && right.size === 0,
      added,
      removed,
      changed,
      items: [
        ...added.map(id => ({ id, kind: "added" as const })),
        ...removed.map(id => ({ id, kind: "removed" as const })),
        ...changed.map(id => ({ id, kind: "changed" as const })),
      ],
    };
  };
  const evidenceDiff = collectionDiff(from?.evidence, to?.evidence);
  const actionDiff = collectionDiff(from?.actionForms, to?.actionForms);

  return (
    <div className="panel cd-version-compare cd-panelpad sq-stack">
      <h2>{strings.heading}</h2>

      {staleAt != null && (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div>
            <strong>{strings.staleTitle ?? "A newer version was submitted."}</strong>{" "}
            {(strings.staleBody ?? "Version v{n} arrived while you had this open — refresh before relying on this comparison.").replace("{n}", String(staleAt))}
            {" "}
            <button type="button" className="btn btn-ghost btn-touch" onClick={() => router.refresh()}>
              {strings.staleRefresh ?? "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* Version selectors — explicit from/to. Default latest vs prior. */}
      <div className="row">
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="cmp-from">{strings.from}</label>
          <select id="cmp-from" className="sq-select" value={fromN ?? ""} onChange={e => setFromN(e.target.value === "" ? undefined : Number(e.target.value))}>
            {numbers.map(n => <option key={n} value={n}>v{n}</option>)}
          </select>
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="cmp-to">{strings.to}</label>
          <select id="cmp-to" className="sq-select" value={toN} onChange={e => setToN(Number(e.target.value))}>
            {numbers.map(n => <option key={n} value={n}>v{n}</option>)}
          </select>
        </div>
      </div>

      {/* Returned-scope authority — always stated; never inferred from the diff. */}
      <Text tone="muted">
        {scopeKnown
          ? strings.scopeSource.replace("{label}", scopeLabel ?? "—")
          : strings.noScope}
      </Text>

      {/* Navigation-only is a property of the whole surface — stated even in the
          no-prior state where there is no rail to scroll. */}
      <Text tone="muted">{strings.navHint}</Text>

      {fromN === undefined ? (
        <div className="sq-banner" role="status"><div>{strings.noPrior}</div></div>
      ) : (
        <>
          {/* One blocking alert for tamper; otherwise a clean status. */}
          {tamper ? (
            <div className="sq-banner sq-banner--critical" role="alert">
              <div><strong>{strings.tamperTitle}</strong> {strings.tamperBody}</div>
            </div>
          ) : scopeKnown && changedRows.length > 0 ? (
            <div className="sq-banner sq-banner--success" role="status">
              <div><strong>{strings.cleanTitle}</strong> {strings.cleanBody}</div>
            </div>
          ) : null}

          {/* Tamper-evident Scope Rail — keyboard disclosure list, non-color glyphs. */}
          <div className="stack" aria-label={strings.heading}>
            {categories.map(cat => {
              const items = rows.filter(r => r.category === cat && (cat === "unchanged" ? true : r.changed));
              if (cat !== "unchanged" && items.length === 0 && counts[cat] === 0 && !(cat === "unavailable" && !scopeKnown)) return null;
              const label = cat === "expected" ? strings.catExpected : cat === "unexpected" ? strings.catUnexpected : cat === "unchanged" ? strings.catUnchanged : strings.catUnavailable;
              const panelId = `cmp-cat-${cat}`;
              return (
                <div key={cat} className="panel panel-body">
                  <button type="button" className="btn btn-ghost btn-touch" aria-expanded={open[cat]} aria-controls={panelId}
                    onClick={() => setOpen(o => ({ ...o, [cat]: !o[cat] }))}>
                    <span className={LOZ[cat]} aria-hidden="true">{GLYPH[cat]}</span>
                    <span>{label}</span>
                    <span className="grow" aria-hidden="true" />
                    <span className="numeric">{cat === "unchanged" ? counts.unchanged : items.length}</span>
                  </button>
                  {open[cat] && (
                    <ul id={panelId} className="stack">
                      {items.length === 0
                        ? <Text as="li" tone="muted">{cat === "unavailable" && !scopeKnown ? strings.noScope : "—"}</Text>
                        : items.map(r => (
                          <li key={r.key}>
                            <button type="button" className="btn btn-ghost btn-touch" onClick={() => goToRow(r.key)}>
                              <span className="numeric">{r.key}</span>
                              {r.section && <Text as="span" tone="muted">{r.section.title}</Text>}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Answer diff — stored snapshots, union of keys. Classification column. */}
          {changedRows.length === 0 ? (
            <div className="sq-banner" role="status"><div>{strings.emptyDiff}</div></div>
          ) : (
            <div className="sq-tablewrap"><table className="sq-table cd-compare-table">
              <thead><tr>
                <th scope="col">{strings.colItem}</th>
                <th scope="col">{strings.colSection}</th>
                <th scope="col">v{fromN}</th>
                <th scope="col">v{toN}</th>
                <th scope="col">{strings.colClass}</th>
              </tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.key} id={`cmp-${r.key}`} data-changed={r.changed ? "true" : "false"} tabIndex={-1}
                  ref={el => { rowRefs.current[r.key] = el; }}
                  className={r.category === "unexpected" ? "cd-row--flag" : undefined}>
                  <td><strong className="numeric">{r.key}</strong></td>
                  <td>{r.section ? r.section.title : <span className="badge badge-warning" aria-hidden="false">{GLYPH.unavailable} {strings.catUnavailable}</span>}</td>
                  <td>{r.prev != null ? (strings.enumLabels[r.prev] ?? r.prev) : "—"}</td>
                  <td>{r.latest != null ? (strings.enumLabels[r.latest] ?? r.latest) : "—"}</td>
                  <td><span className={LOZ[r.category]}><span aria-hidden="true">{GLYPH[r.category]}</span>{" "}{
                    r.category === "expected" ? strings.catExpected : r.category === "unexpected" ? strings.catUnexpected : r.category === "unchanged" ? strings.catUnchanged : strings.catUnavailable
                  }</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </>
      )}

      {/* Explicitly unavailable comparison categories — never rendered as "unchanged". */}
      {([
        [strings.evidenceCollection, evidenceDiff],
        [strings.actionCollection, actionDiff],
      ] as const).map(([label, diff]) => !diff || diff.empty ? null : (
        <div key={label} className="panel">
          <div className="panel-body stack">
            <div>
              <span>{label}</span>
              <span className="badge">
                {diff.added.length} {strings.added} · {diff.removed.length} {strings.removed} · {diff.changed.length} {strings.changed}
              </span>
            </div>
            <ul className="stack">
              {diff.items.map(item => (
                <li key={`${item.kind}:${item.id}`}>
                  <span className={`badge ${item.kind === "added" ? "badge-success" : item.kind === "removed" ? "badge-critical" : "badge-warning"}`}>
                    {item.kind === "added" ? strings.added : item.kind === "removed" ? strings.removed : strings.changed}
                  </span>
                  <span>{item.id}</span>
                  {item.kind === "changed" && <Text as="span" tone="muted">current → proposed</Text>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <div className="panel panel-body">
        <Overline>{strings.unavailableHeading}</Overline>
        {!evidenceDiff && <Text tone="muted"><span className="badge badge-warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailEvidence}</Text>}
        <Text tone="muted"><span className="badge badge-warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailPackage}</Text>
        {!actionDiff && <Text tone="muted"><span className="badge badge-warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailMetadata}</Text>}
        <Text tone="muted">{strings.unavailNote}</Text>
      </div>
    </div>
  );
}
