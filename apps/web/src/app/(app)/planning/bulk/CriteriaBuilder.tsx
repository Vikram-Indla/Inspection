"use client";
// CD-021 (SCR-WEB-110) — criteria tree instrument (design frames 1a/1d).
// M01-003/012/022 extended to nested ALL/ANY groups. M6: the field list comes
// from the governed criteria dictionary (FIELD_REGISTRY) — supplied fields with
// per-type operators (text: is/is-not/contains/one-of · number: is/is-not/
// greater/less/between · date: is/after/before/between), CONTRACT_NOT_SUPPLIED
// fields disabled with their honest explanation (PLN-CON-019). The builder only
// COLLECTS criteria — evaluation stays server-side. On Apply it serializes the
// tree into a single `ct` URL param and GET-submits, so criteria remain
// URL-reproducible (legacy cf/co/cv links still parse server-side). ARIA tree
// pattern; reorder via keyboard-operable move buttons; the match count is
// announced via aria-live.
import { useMemo, useState } from "react";
import {
  type GroupNode, type CriteriaNode, type CondNode, type Field, type FieldType, type Op,
  newCond, emptyTree, serializeCriteria, leaves, pathKey,
} from "./criteria";

export type BuilderField = {
  key: string;
  label: string;
  type: FieldType;
  operators: { op: Op; label: string }[];
  supplied: boolean;
  reason?: string; // CONTRACT_NOT_SUPPLIED explanation (disabled fields)
};

export type CriteriaBuilderStrings = {
  heading: string;
  combineLabel: string; combineAll: string; combineAny: string;
  fieldLabel: string; opLabel: string; valueLabel: string; valuePlaceholder: string;
  valueToLabel: string; inHint: string; notSuppliedTag: string;
  addCondition: string; addGroup: string; remove: string; removeGroup: string;
  moveUp: string; moveDown: string;
  apply: string; clear: string; matching: string; hint: string;
  groupItem: string; conditionItem: string;
  invalidTitle: string; invalidBody: string;
  contributionLabel: string; unfocusLabel: string;
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

// A between leaf is only complete when BOTH bounds are filled — a one-sided
// range would silently match nothing server-side (same honesty bar as a blank
// value, ERR-PLN-001).
const leafIncomplete = (c: CondNode): boolean => {
  const v = c.value.trim();
  if (v === "") return true;
  if (c.op === "between") {
    const i = v.indexOf("..");
    if (i < 0) return true;
    return v.slice(0, i).trim() === "" || v.slice(i + 2).trim() === "";
  }
  return false;
};

export default function CriteriaBuilder({
  initialTree, fieldOptions, matchCount, strings, contributions, focusedPath, onFocus,
  builderFields, cityByRegion,
}: {
  initialTree: GroupNode;
  fieldOptions: Record<string, string[]>;
  matchCount: number;
  strings: CriteriaBuilderStrings;
  contributions?: Record<string, number>;
  focusedPath?: string | null;
  onFocus?: (path: string | null) => void;
  builderFields: BuilderField[];
  cityByRegion?: Record<string, string[]>;
}) {
  const [tree, setTree] = useState<GroupNode>(
    initialTree.children.length ? initialTree : { ...emptyTree(), children: [newCond()] }
  );
  const ct = useMemo(() => serializeCriteria(tree), [tree]);
  const invalid = useMemo(() => leaves(tree).filter(l => leafIncomplete(l.node)), [tree]);
  const [showInvalid, setShowInvalid] = useState(false);

  const fieldOf = (key: string): BuilderField =>
    builderFields.find(f => f.key === key) ?? builderFields[0];
  const suppliedFields = builderFields.filter(f => f.supplied);
  const notSuppliedFields = builderFields.filter(f => !f.supplied);

  // Region-dependent city suggestions: union the cities of every region named
  // in an eq/one-of region condition; fall back to the full city list when no
  // region criterion exists (never invent pairings).
  const regionSelections = useMemo(() => {
    const out: string[] = [];
    for (const leaf of leaves(tree)) {
      if (leaf.node.field !== "region") continue;
      if (leaf.node.op === "eq") out.push(leaf.node.value.trim());
      if (leaf.node.op === "in") out.push(...leaf.node.value.split(",").map(s => s.trim()));
    }
    return out.filter(Boolean);
  }, [tree]);
  const optionsFor = (fieldKey: string): string[] => {
    if (fieldKey === "city" && cityByRegion && regionSelections.length > 0) {
      const union = new Set<string>();
      for (const r of regionSelections) for (const c of cityByRegion[r] ?? []) union.add(c);
      if (union.size > 0) return [...union].sort();
    }
    return fieldOptions[fieldKey] ?? [];
  };

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

  const valueInput = (c: CondNode, parentPath: number[], idx: number, key: string) => {
    const def = fieldOf(c.field);
    const isEmpty = leafIncomplete(c);
    const patchValue = (value: string) => patchCond(parentPath, idx, { value });
    if (c.op === "between") {
      const i = c.value.indexOf("..");
      const a = i < 0 ? c.value : c.value.slice(0, i);
      const b = i < 0 ? "" : c.value.slice(i + 2);
      const join = (x: string, y: string) => `${x}..${y}`;
      const inputType = def.type === "date" ? "date" : "number";
      return (
        <>
          <div className="field" style={{ maxInlineSize: 150 }}>
            <label className="sq-field__label" htmlFor={`crit-value-${key}`}>{strings.valueLabel}</label>
            <input className="input" id={`crit-value-${key}`} type={inputType} value={a} aria-invalid={isEmpty || undefined}
              onChange={e => patchValue(join(e.target.value, b))} />
          </div>
          <div className="field" style={{ maxInlineSize: 150 }}>
            <label className="sq-field__label" htmlFor={`crit-value2-${key}`}>{strings.valueToLabel}</label>
            <input className="input" id={`crit-value2-${key}`} type={inputType} value={b} aria-invalid={isEmpty || undefined}
              onChange={e => patchValue(join(a, e.target.value))} />
          </div>
        </>
      );
    }
    if (def.type === "number") {
      return (
        <div className="field" style={{ maxInlineSize: 150 }}>
          <label className="sq-field__label" htmlFor={`crit-value-${key}`}>{strings.valueLabel}</label>
          <input className="input" id={`crit-value-${key}`} type="number" value={c.value} aria-invalid={isEmpty || undefined}
            onChange={e => patchValue(e.target.value)} placeholder={strings.valuePlaceholder} />
        </div>
      );
    }
    if (def.type === "date") {
      return (
        <div className="field" style={{ maxInlineSize: 170 }}>
          <label className="sq-field__label" htmlFor={`crit-value-${key}`}>{strings.valueLabel}</label>
          <input className="input" id={`crit-value-${key}`} type="date" value={c.value} aria-invalid={isEmpty || undefined}
            onChange={e => patchValue(e.target.value)} />
        </div>
      );
    }
    if (def.type === "enum" && c.op !== "in") {
      return (
        <div className="field" style={{ maxInlineSize: 280 }}>
          <label className="sq-field__label" htmlFor={`crit-value-${key}`}>{strings.valueLabel}</label>
          <select className="select" id={`crit-value-${key}`} value={c.value} aria-invalid={isEmpty || undefined}
            onChange={e => patchValue(e.target.value)}>
            <option value="">{strings.valuePlaceholder}</option>
            {optionsFor(c.field).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      );
    }
    // text / enum — free input with governed suggestions; "one of" is a comma list.
    return (
      <div className="field" style={{ maxInlineSize: 210 }}>
        <label className="sq-field__label" htmlFor={`crit-value-${key}`}>{strings.valueLabel}</label>
        <input className="input" id={`crit-value-${key}`} list={`vals-${key}`} value={c.value} aria-invalid={isEmpty || undefined}
          onChange={e => patchValue(e.target.value)} placeholder={strings.valuePlaceholder} />
        <datalist id={`vals-${key}`}>
          {optionsFor(c.field).map(v => <option key={v} value={v} />)}
        </datalist>
        {c.op === "in" && <span className="t-caption">{strings.inHint}</span>}
      </div>
    );
  };

  const renderCond = (c: CondNode, parentPath: number[], idx: number, count: number) => {
    const key = pathKey([...parentPath, idx]);
    const contribution = contributions?.[key];
    const isFocused = focusedPath === key;
    const def = fieldOf(c.field);
    return (
    <li role="treeitem" aria-label={strings.conditionItem} className="sq-rule">
      <div className="field" style={{ maxInlineSize: 200 }}>
        <label className="sq-field__label" htmlFor={`crit-field-${key}`}>{strings.fieldLabel}</label>
        <select className="select" id={`crit-field-${key}`} value={c.field}
          onChange={e => {
            const next = fieldOf(e.target.value);
            patchCond(parentPath, idx, { field: e.target.value as Field, op: next.operators[0]?.op ?? "eq", value: "" });
          }}>
          {suppliedFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          {notSuppliedFields.map(f => (
            <option key={f.key} value={f.key} disabled>{f.label} · {strings.notSuppliedTag}</option>
          ))}
        </select>
      </div>
      <div className="field" style={{ maxInlineSize: 150 }}>
        <label className="sq-field__label" htmlFor={`crit-op-${key}`}>{strings.opLabel}</label>
        <select className="select" id={`crit-op-${key}`} value={c.op}
          onChange={e => patchCond(parentPath, idx, { op: e.target.value as Op, value: "" })}>
          {def.operators.map(o => <option key={o.op} value={o.op}>{o.label}</option>)}
        </select>
      </div>
      {valueInput(c, parentPath, idx, key)}
      {contribution != null && (
        <button type="button" className="btn btn-ghost numeric btn-touch" aria-pressed={isFocused}
          onClick={() => onFocus?.(isFocused ? null : key)}
          aria-label={(isFocused ? strings.unfocusLabel : strings.contributionLabel.replace("{n}", String(contribution)))}
          style={isFocused ? { borderColor: "var(--action-primary)", fontWeight: 600 } : undefined}>
          {contribution}
        </button>
      )}
      <button type="button" className="btn btn-ghost btn-touch" onClick={() => move(parentPath, idx, -1)} disabled={idx === 0} aria-label={strings.moveUp}>↑</button>
      <button type="button" className="btn btn-ghost btn-touch" onClick={() => move(parentPath, idx, 1)} disabled={idx === count - 1} aria-label={strings.moveDown}>↓</button>
      <button type="button" className="btn btn-ghost btn-touch" onClick={() => removeAt(parentPath, idx)}>{strings.remove}</button>
    </li>
    );
  };

  const renderGroup = (g: GroupNode, path: number[]): React.ReactNode => (
    <li role="treeitem" aria-label={strings.groupItem}
      style={{ listStyle: "none", borderInlineStart: "2px solid var(--border-subtle)", paddingInlineStart: "var(--space-4)" }}>
      <div className="row" style={{ alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div className="field" style={{ maxInlineSize: 220 }}>
          <label className="sq-field__label" htmlFor={`crit-combine-${path.length ? pathKey(path) : "root"}`}>{strings.combineLabel}</label>
          <select className="select" id={`crit-combine-${path.length ? pathKey(path) : "root"}`} value={g.combine} onChange={e => setCombine(path, e.target.value as "all" | "any")}>
            <option value="all">{strings.combineAll}</option>
            <option value="any">{strings.combineAny}</option>
          </select>
        </div>
        {path.length > 0 && (
          <button type="button" className="btn btn-ghost btn-touch" onClick={() => removeAt(path.slice(0, -1), path[path.length - 1])}>{strings.removeGroup}</button>
        )}
      </div>
      <ul role="group" style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {g.children.map((child, i) =>
          child.kind === "cond"
            ? <span key={i}>{renderCond(child, path, i, g.children.length)}</span>
            : <span key={i}>{renderGroup(child, [...path, i])}</span>
        )}
      </ul>
      <div className="row" style={{ gap: "var(--space-3)", marginBlockStart: "var(--space-3)" }}>
        <button type="button" className="btn btn-secondary btn-touch" onClick={() => addCond(path)}>{strings.addCondition}</button>
        <button type="button" className="btn btn-ghost btn-touch" onClick={() => addGroup(path)}>{strings.addGroup}</button>
      </div>
    </li>
  );

  return (
    <form method="get" action="/planning/bulk" className="panel"
      onSubmit={e => { if (invalid.length > 0) { e.preventDefault(); setShowInvalid(true); } }}
      style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>
      <input type="hidden" name="ct" value={ct} />
      <ul role="tree" aria-label={strings.heading} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {renderGroup(tree, [])}
      </ul>
      {notSuppliedFields.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {notSuppliedFields.map(f => (
            <li key={f.key} className="t-caption">
              <span className="sq-lozenge sq-lozenge--warning">{f.label} · {strings.notSuppliedTag}</span> — {f.reason}
            </li>
          ))}
        </ul>
      )}
      {showInvalid && invalid.length > 0 && (
        <div className="sq-banner sq-banner--warning" role="alert">
          <strong>{strings.invalidTitle}</strong>
          <p>{strings.invalidBody.replace("{n}", String(invalid.length))}</p>
        </div>
      )}
      <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-primary btn-lg btn-touch">{strings.apply}</button>
        <a className="btn btn-ghost btn-touch" href="/planning/bulk">{strings.clear}</a>
        <span className="t-caption numeric" role="status" aria-live="polite">{strings.matching.replace("{n}", String(matchCount))}</span>
      </div>
      <p className="t-caption">{strings.hint}</p>
    </form>
  );
}
