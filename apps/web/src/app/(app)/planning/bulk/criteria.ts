// CD-021 (SCR-WEB-110) — shared criteria model for the Targeting Lens.
//
// Extends the governed AND/OR contract (M01-003/012/022) to NESTED ALL/ANY
// groups while keeping the flat cf/co/cv URL contract parseable for backward
// compatibility (existing bookmarks keep working). Pure module — no React, no
// DOM — so the server page and the client builder share one source of truth
// for parsing, serialization and evaluation. The server remains the ONLY
// evaluator; the client just collects criteria into `ct` and GET-submits.

export const CRITERIA_FIELDS = ["region", "risk_band", "activity_class", "city"] as const;
export type Field = (typeof CRITERIA_FIELDS)[number];
export type Op = "is" | "is-not";

export type CondNode = { kind: "cond"; field: Field; op: Op; value: string };
export type GroupNode = { kind: "group"; combine: "all" | "any"; children: CriteriaNode[] };
export type CriteriaNode = CondNode | GroupNode;

// Defensive caps — `ct` is untrusted URL input. Bound depth and node count so a
// crafted URL can't force pathological server work.
const MAX_DEPTH = 5;
const MAX_NODES = 60;

const isField = (v: unknown): v is Field => (CRITERIA_FIELDS as readonly string[]).includes(v as string);
const isOp = (v: unknown): v is Op => v === "is" || v === "is-not";

export const emptyTree = (): GroupNode => ({ kind: "group", combine: "all", children: [] });
export const newCond = (): CondNode => ({ kind: "cond", field: "region", op: "is", value: "" });

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
    const value = String(o.v ?? "").trim();
    if (value === "") { counter.invalidBlank = true; return null; }
    return { kind: "cond", field: o.f, op: o.o, value };
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
    .map((field, i) => ({ field, op: co[i] === "is-not" ? "is-not" : "is", value: (cv[i] ?? "").trim() }))
    .filter(c => isField(c.field) && c.value !== "")
    .map(c => ({ kind: "cond", field: c.field as Field, op: c.op as Op, value: c.value }));
  if (children.length === 0) return null;
  return { kind: "group", combine: combine === "or" ? "any" : "all", children };
}

// ---- evaluation (server-side only) -----------------------------------------
export type FactoryRow = Record<string, unknown>;

function matchesCond(f: FactoryRow, c: CondNode): boolean {
  const fv = String(f[c.field] ?? "").toLowerCase().trim();
  const tv = c.value.toLowerCase().trim();
  const equal = fv === tv;
  return c.op === "is-not" ? !equal : equal;
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
