// CD-021 (SCR-WEB-110) — shared criteria model for the Targeting Lens.
//
// Extends the governed AND/OR contract (M01-003/012/022) to NESTED ALL/ANY
// groups while keeping the flat cf/co/cv URL contract parseable for backward
// compatibility (existing bookmarks keep working). Pure module — no React, no
// DOM — so the server page and the client builder share one source of truth
// for parsing, serialization and evaluation. The server remains the ONLY
// evaluator; the client just collects criteria into `ct` and GET-submits.
//
// M6 — criteria dictionary. Fields are governed by FIELD_REGISTRY: every
// ACTIVE field carries a type and its allowed operators; every contracted but
// NOT-SUPPLIED field (PLN-CON-019) is listed with supplied:false and a reason
// key, renders disabled in the builder, and is NEVER evaluated as zero,
// empty-string or any other fabricated value. Legacy "is"/"is-not" operators
// in old `ct` payloads parse to eq/neq so existing links keep working.

// ---- operators -------------------------------------------------------------
// Canonical operator set. Text fields: eq/neq/contains/in (comma list).
// Numeric fields: eq/neq/gt/lt/between ("a..b"). Date fields: eq/gt(after)/
// lt(before)/between ("a..b", inclusive). Enum fields behave as text.
export type Op = "eq" | "neq" | "contains" | "in" | "gt" | "lt" | "between";
// Legacy aliases accepted at the parse boundary only — never serialized.
type LegacyOp = "is" | "is-not";
const LEGACY_OP_MAP: Record<LegacyOp, Op> = { is: "eq", "is-not": "neq" };

export type FieldType = "text" | "number" | "date" | "enum";

export type FieldDef = {
  key: string;
  type: FieldType;
  operators: Op[];          // canonical ops the builder offers for this field
  supplied: boolean;        // false → CONTRACT_NOT_SUPPLIED (disabled, explained)
  notSuppliedKey?: string;  // ui_strings key carrying the honest explanation
};

// The governed criteria dictionary (PLN-CON-019). Order is display order:
// supplied fields first, contract-not-supplied fields after. Adding a field
// here wires it through parse → evaluate → builder with no other code change.
export const FIELD_REGISTRY: FieldDef[] = [
  // ---- ACTIVE — backed by verified staging sources -------------------------
  { key: "region", type: "text", operators: ["eq", "neq", "contains", "in"], supplied: true },
  { key: "city", type: "text", operators: ["eq", "neq", "contains", "in"], supplied: true },
  { key: "risk_band", type: "enum", operators: ["eq", "neq", "in"], supplied: true },
  { key: "activity_class", type: "text", operators: ["eq", "neq", "contains", "in"], supplied: true },
  // Computed per factory from violations → inspections → visits (count), the
  // latest review decision and the latest submitted inspection date. Missing
  // history matches NOTHING for numeric/date ops (absence ≠ 0), and previous
  // outcome eq/neq compares the decision string only when one exists.
  { key: "previous_violation_count", type: "number", operators: ["eq", "neq", "gt", "lt", "between"], supplied: true },
  { key: "previous_outcome", type: "enum", operators: ["eq", "neq"], supplied: true },
  { key: "last_inspection_date", type: "date", operators: ["eq", "gt", "lt", "between"], supplied: true },
  // ---- CONTRACT_NOT_SUPPLIED (PLN-CON-019) — disabled with explanation -----
  // These are contracted targeting dimensions with no governed populated
  // source (staging: industrial_licenses ~1% populated, factory_products 4
  // factories, employees_total 4/1339, no sector/land-provider/authority
  // columns). They are listed honestly, never silently absent and never
  // evaluated as zero/blank.
  { key: "sector", type: "text", operators: ["eq"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsSector" },
  { key: "license_stage", type: "enum", operators: ["eq"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsLicenseStage" },
  { key: "license_status", type: "enum", operators: ["eq"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsLicenseStatus" },
  { key: "product_hs_code", type: "text", operators: ["eq", "contains"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsProductHs" },
  { key: "land_provider", type: "text", operators: ["eq"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsLandProvider" },
  { key: "employee_count", type: "number", operators: ["eq", "gt", "lt", "between"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsEmployeeCount" },
  { key: "issuing_authority", type: "text", operators: ["eq"], supplied: false, notSuppliedKey: "plan.bulk.criteria.nsIssuingAuthority" },
];

// Backward-compatible export: the ACTIVE (supplied) field keys. CriteriaBuilder
// iterates FIELD_REGISTRY directly; this stays for the parse guard and older
// import sites.
export const CRITERIA_FIELDS = FIELD_REGISTRY.filter(f => f.supplied).map(f => f.key);
export type Field = string;

const fieldDef = (key: string): FieldDef | undefined => FIELD_REGISTRY.find(f => f.key === key);

export type CondNode = { kind: "cond"; field: Field; op: Op; value: string };
export type GroupNode = { kind: "group"; combine: "all" | "any"; children: CriteriaNode[] };
export type CriteriaNode = CondNode | GroupNode;

// Defensive caps — `ct` is untrusted URL input. Bound depth and node count so a
// crafted URL can't force pathological server work.
const MAX_DEPTH = 5;
const MAX_NODES = 60;

const isField = (v: unknown): v is Field => typeof v === "string" && fieldDef(v)?.supplied === true;
const isOp = (v: unknown): v is Op | LegacyOp =>
  typeof v === "string" && (["eq", "neq", "contains", "in", "gt", "lt", "between"] as const).includes(v as Op) || v === "is" || v === "is-not";
const canonOp = (v: string): Op => (LEGACY_OP_MAP[v as LegacyOp] ?? v) as Op;

export const emptyTree = (): GroupNode => ({ kind: "group", combine: "all", children: [] });
export const newCond = (): CondNode => ({ kind: "cond", field: "region", op: "eq", value: "" });

// ---- serialization (compact short keys keep the URL short) -----------------
type WireCond = { k: "c"; f: string; o: string; v: string };
type WireGroup = { k: "g"; c: "all" | "any"; n: Wire[] };
type Wire = WireCond | WireGroup;

const toWire = (n: CriteriaNode): Wire =>
  n.kind === "cond"
    ? { k: "c", f: n.field, o: n.op, v: n.value }
    : { k: "g", c: n.combine, n: n.children.map(toWire) };

export function serializeCriteria(tree: GroupNode): string {
  return JSON.stringify(toWire(tree));
}

// Parse + sanitize. Unknown fields/bad operators remain forward-compatible and
// are dropped, but a known condition with an empty value marks the whole URL
// criteria payload invalid. That prevents a crafted URL containing one valid
// condition plus one blank condition from silently narrowing the user's intent.
function fromWire(w: unknown, depth: number, counter: { n: number; invalidBlank: boolean }): CriteriaNode | null {
  if (depth > MAX_DEPTH || counter.n >= MAX_NODES || typeof w !== "object" || w === null) return null;
  counter.n += 1;
  const o = w as Record<string, unknown>;
  if (o.k === "c") {
    if (!isField(o.f) || !isOp(o.o)) return null;
    const op = canonOp(String(o.o));
    const def = fieldDef(String(o.f))!;
    // An operator the field does not support (e.g. gt on a text field) is
    // dropped like any other malformed condition — never coerced.
    if (!def.operators.includes(op)) return null;
    const value = String(o.v ?? "").trim();
    if (value === "") { counter.invalidBlank = true; return null; }
    return { kind: "cond", field: String(o.f), op, value };
  }
  if (o.k === "g") {
    const combine = o.c === "any" ? "any" : "all";
    const raw = Array.isArray(o.n) ? o.n : [];
    const children = raw.map(c => fromWire(c, depth + 1, counter)).filter((c): c is CriteriaNode => c !== null);
    if (children.length === 0) return null;
    return { kind: "group", combine, children };
  }
  return null;
}

export function parseCt(ct: string | undefined): GroupNode | null {
  if (!ct) return null;
  try {
    const counter = { n: 0, invalidBlank: false };
    const node = fromWire(JSON.parse(ct), 0, counter);
    if (counter.invalidBlank) return null;
    if (node && node.kind === "group") return node;
    if (node && node.kind === "cond") return { kind: "group", combine: "all", children: [node] };
    return null;
  } catch {
    return null;
  }
}

// Backward-compat: build a flat single-group tree from legacy cf/co/cv arrays.
export function fromFlat(cf: string[], co: string[], cv: string[], combine: string): GroupNode | null {
  const children: CriteriaNode[] = cf
    .map((field, i) => ({ field, op: co[i] === "is-not" ? "neq" as Op : "eq" as Op, value: (cv[i] ?? "").trim() }))
    .filter(c => isField(c.field) && c.value !== "" && (fieldDef(c.field)?.operators.includes(c.op) ?? false))
    .map(c => ({ kind: "cond", field: c.field, op: c.op, value: c.value }));
  if (children.length === 0) return null;
  return { kind: "group", combine: combine === "or" ? "any" : "all", children };
}

// ---- evaluation (server-side only) -----------------------------------------
export type FactoryRow = Record<string, unknown>;

const textOf = (v: unknown): string => String(v ?? "").toLowerCase().trim();
const numOf = (v: unknown): number => (typeof v === "number" ? v : Number(String(v ?? "").trim()));
// ISO date (or datetime) → comparable YYYY-MM-DD day string; "" when absent.
const dayOf = (v: unknown): string => {
  const s = String(v ?? "").trim();
  return s.length >= 10 ? s.slice(0, 10) : "";
};
// "a..b" range values for between; both bounds inclusive.
const rangeOf = (v: string): [string, string] | null => {
  const i = v.indexOf("..");
  if (i < 0) return null;
  const a = v.slice(0, i).trim();
  const b = v.slice(i + 2).trim();
  return a === "" || b === "" ? null : [a, b];
};

function matchesCond(f: FactoryRow, c: CondNode): boolean {
  const def = fieldDef(c.field);
  if (!def || !def.supplied) return false; // not-supplied fields never evaluate
  const raw = f[c.field];

  if (def.type === "number") {
    // Absence is not zero: a factory with no recorded history matches nothing.
    if (raw == null || String(raw).trim() === "") return false;
    const n = numOf(raw);
    if (!Number.isFinite(n)) return false;
    if (c.op === "between") {
      const r = rangeOf(c.value);
      if (!r) return false;
      const [a, b] = [Number(r[0]), Number(r[1])];
      return Number.isFinite(a) && Number.isFinite(b) && n >= a && n <= b;
    }
    const tv = Number(c.value);
    if (!Number.isFinite(tv)) return false;
    if (c.op === "eq") return n === tv;
    if (c.op === "neq") return n !== tv;
    if (c.op === "gt") return n > tv;
    if (c.op === "lt") return n < tv;
    return false;
  }

  if (def.type === "date") {
    const d = dayOf(raw);
    if (d === "") return false; // no recorded inspection date — honest absence
    if (c.op === "between") {
      const r = rangeOf(c.value);
      return !!r && d >= r[0] && d <= r[1];
    }
    const tv = dayOf(c.value);
    if (tv === "") return false;
    if (c.op === "eq") return d === tv;
    if (c.op === "gt") return d > tv;
    if (c.op === "lt") return d < tv;
    return false;
  }

  // text / enum
  const fv = textOf(raw);
  const tv = c.value.toLowerCase().trim();
  if (c.op === "eq") return fv === tv;
  if (c.op === "neq") return fv !== tv;
  if (c.op === "contains") return tv !== "" && fv.includes(tv);
  if (c.op === "in") {
    const set = c.value.split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
    return set.includes(fv);
  }
  return false;
}

export function evalNode(f: FactoryRow, node: CriteriaNode): boolean {
  if (node.kind === "cond") return matchesCond(f, node);
  if (node.children.length === 0) return true; // empty group filters nothing
  const results = node.children.map(c => evalNode(f, c));
  return node.combine === "all" ? results.every(Boolean) : results.some(Boolean);
}

// True when the tree has at least one usable condition (else "match everything").
export function hasCriteria(tree: GroupNode | null): boolean {
  if (!tree) return false;
  const walk = (n: CriteriaNode): boolean =>
    n.kind === "cond" ? true : n.children.some(walk);
  return walk(tree);
}

// ---- shared leaf access (used by empty-value validation AND focus/contribution) ---
export type Leaf = { path: number[]; node: CondNode };

export function leaves(node: CriteriaNode, path: number[] = []): Leaf[] {
  if (node.kind === "cond") return [{ path, node }];
  return node.children.flatMap((c, i) => leaves(c, [...path, i]));
}

export const pathKey = (path: number[]): string => path.join(".");

// Leaves with a blank value are never submittable — the server silently drops
// them (see fromWire), which previously meant a half-filled condition vanished
// with no warning (ERR-PLN-001: "Invalid criteria... show exact invalid rule").
export function emptyValueLeaves(tree: GroupNode): Leaf[] {
  return leaves(tree).filter(l => l.node.value.trim() === "");
}
