"use client";
// CD-021 (SCR-WEB-110) — criteria tree instrument (design frames 1a/1d).
// M01-003/012/022 extended to nested ALL/ANY groups. Each condition is
// field ∈ {region, risk_band, activity_class, city} · operator ∈ {is, is-not}
// · value. Groups combine their children with ALL (AND) or ANY (OR) and may
// nest. The builder only COLLECTS criteria — evaluation stays server-side. On
// Apply it serializes the tree into a single `ct` URL param and GET-submits, so
// criteria remain URL-reproducible (legacy cf/co/cv links still parse server-
// side). ARIA tree pattern; reorder via keyboard-operable move buttons; the
// match count is announced via aria-live.
import { useMemo, useState } from "react";
import {
  type GroupNode, type CriteriaNode, type CondNode, type Field,
  CRITERIA_FIELDS, newCond, emptyTree, serializeCriteria,
} from "./criteria";

export type CriteriaBuilderStrings = {
  heading: string;
  combineLabel: string; combineAll: string; combineAny: string;
  fieldLabel: string; opLabel: string; valueLabel: string; valuePlaceholder: string;
  fieldRegion: string; fieldRiskBand: string; fieldActivity: string; fieldCity: string;
  opIs: string; opIsNot: string;
  addCondition: string; addGroup: string; remove: string; removeGroup: string;
  moveUp: string; moveDown: string;
  apply: string; clear: string; matching: string; hint: string;
  groupItem: string; conditionItem: string;
};

// Immutably transform the group living at `path` (indices into nested children).
function modifyGroupAt(root: GroupNode, path: number[], fn: (g: GroupNode) => GroupNode): GroupNode {
  if (path.length === 0) return fn(root);
  const [i, ...rest] = path;
  const child = root.children[i];
  if (!child || child.kind !== "group") return root;
  const children = root.children.slice();
  children[i] = modifyGroupAt(child, rest, fn);
  return { ...root, children };
}
// Transform the children array of the group at `parentPath`.
function editChildren(root: GroupNode, parentPath: number[], fn: (ch: CriteriaNode[]) => CriteriaNode[]): GroupNode {
  return modifyGroupAt(root, parentPath, g => ({ ...g, children: fn(g.children) }));
}

export default function CriteriaBuilder({ initialTree, fieldOptions, matchCount, strings }: {
  initialTree: GroupNode;
  fieldOptions: Record<string, string[]>;
  matchCount: number;
  strings: CriteriaBuilderStrings;
}) {
  const [tree, setTree] = useState<GroupNode>(
    initialTree.children.length ? initialTree : { ...emptyTree(), children: [newCond()] }
  );
  const ct = useMemo(() => serializeCriteria(tree), [tree]);

  const fieldLabel = (f: string) =>
    f === "region" ? strings.fieldRegion
      : f === "risk_band" ? strings.fieldRiskBand
        : f === "activity_class" ? strings.fieldActivity
          : strings.fieldCity;

  const addCond = (path: number[]) => setTree(t => editChildren(t, path, ch => [...ch, newCond()]));
  const addGroup = (path: number[]) => setTree(t => editChildren(t, path, ch => [...ch, { kind: "group", combine: "any", children: [newCond()] }]));
  const setCombine = (path: number[], combine: "all" | "any") => setTree(t => modifyGroupAt(t, path, g => ({ ...g, combine })));
  const removeAt = (parentPath: number[], idx: number) => setTree(t => editChildren(t, parentPath, ch => ch.filter((_, i) => i !== idx)));
  const patchCond = (parentPath: number[], idx: number, patch: Partial<CondNode>) =>
    setTree(t => editChildren(t, parentPath, ch => ch.map((c, i) => (i === idx && c.kind === "cond" ? { ...c, ...patch } : c))));
  const move = (parentPath: number[], idx: number, dir: -1 | 1) => setTree(t => editChildren(t, parentPath, ch => {
    const j = idx + dir;
    if (j < 0 || j >= ch.length) return ch;
    const next = ch.slice(); [next[idx], next[j]] = [next[j], next[idx]]; return next;
  }));

  const renderCond = (c: CondNode, parentPath: number[], idx: number, count: number) => (
    <li role="treeitem" aria-label={strings.conditionItem} className="ax-row"
      style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
      <div className="ax-field" style={{ maxInlineSize: 180 }}>
        <label className="ax-field__label">{strings.fieldLabel}</label>
        <select className="ax-select" value={c.field}
          onChange={e => patchCond(parentPath, idx, { field: e.target.value as Field, value: "" })}>
          {CRITERIA_FIELDS.map(f => <option key={f} value={f}>{fieldLabel(f)}</option>)}
        </select>
      </div>
      <div className="ax-field" style={{ maxInlineSize: 140 }}>
        <label className="ax-field__label">{strings.opLabel}</label>
        <select className="ax-select" value={c.op} onChange={e => patchCond(parentPath, idx, { op: e.target.value as "is" | "is-not" })}>
          <option value="is">{strings.opIs}</option>
          <option value="is-not">{strings.opIsNot}</option>
        </select>
      </div>
      <div className="ax-field" style={{ maxInlineSize: 210 }}>
        <label className="ax-field__label">{strings.valueLabel}</label>
        <input className="ax-input" list={`vals-${c.field}`} value={c.value}
          onChange={e => patchCond(parentPath, idx, { value: e.target.value })} placeholder={strings.valuePlaceholder} />
        <datalist id={`vals-${c.field}`}>
          {(fieldOptions[c.field] ?? []).map(v => <option key={v} value={v} />)}
        </datalist>
      </div>
      <button type="button" className="ax-btn ax-btn--subtle" onClick={() => move(parentPath, idx, -1)} disabled={idx === 0} aria-label={strings.moveUp}>↑</button>
      <button type="button" className="ax-btn ax-btn--subtle" onClick={() => move(parentPath, idx, 1)} disabled={idx === count - 1} aria-label={strings.moveDown}>↓</button>
      <button type="button" className="ax-btn ax-btn--subtle" onClick={() => removeAt(parentPath, idx)}>{strings.remove}</button>
    </li>
  );

  const renderGroup = (g: GroupNode, path: number[]): React.ReactNode => (
    <li role="treeitem" aria-label={strings.groupItem}
      style={{ listStyle: "none", borderInlineStart: "2px solid var(--ax-color-border)", paddingInlineStart: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ alignItems: "flex-end", gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
        <div className="ax-field" style={{ maxInlineSize: 220 }}>
          <label className="ax-field__label">{strings.combineLabel}</label>
          <select className="ax-select" value={g.combine} onChange={e => setCombine(path, e.target.value as "all" | "any")}>
            <option value="all">{strings.combineAll}</option>
            <option value="any">{strings.combineAny}</option>
          </select>
        </div>
        {path.length > 0 && (
          <button type="button" className="ax-btn ax-btn--subtle" onClick={() => removeAt(path.slice(0, -1), path[path.length - 1])}>{strings.removeGroup}</button>
        )}
      </div>
      <ul role="group" style={{ listStyle: "none", margin: "var(--ax-space-150) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        {g.children.map((child, i) =>
          child.kind === "cond"
            ? <span key={i}>{renderCond(child, path, i, g.children.length)}</span>
            : <span key={i}>{renderGroup(child, [...path, i])}</span>
        )}
      </ul>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", marginBlockStart: "var(--ax-space-150)" }}>
        <button type="button" className="ax-btn ax-btn--secondary" onClick={() => addCond(path)}>{strings.addCondition}</button>
        <button type="button" className="ax-btn ax-btn--subtle" onClick={() => addGroup(path)}>{strings.addGroup}</button>
      </div>
    </li>
  );

  return (
    <form method="get" action="/planning/bulk" className="ax-surface"
      style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>
      <input type="hidden" name="ct" value={ct} />
      <ul role="tree" aria-label={strings.heading} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {renderGroup(tree, [])}
      </ul>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent">{strings.apply}</button>
        <a className="ax-btn ax-btn--subtle" href="/planning/bulk">{strings.clear}</a>
        <span className="ax-caption ax-numeric" role="status" aria-live="polite">{strings.matching.replace("{n}", String(matchCount))}</span>
      </div>
      <p className="ax-caption">{strings.hint}</p>
    </form>
  );
}
