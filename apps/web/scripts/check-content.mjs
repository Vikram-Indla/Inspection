#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const WEB_ROOT = join(import.meta.dirname, "..");
const EN_DIR = join(WEB_ROOT, "src/i18n/locales/en");
const AR_DIR = join(WEB_ROOT, "src/i18n/locales/ar");
const VOCAB_PATH = join(import.meta.dirname, "content-vocabulary.json");
const BASELINE_PATH = join(import.meta.dirname, "content-baseline.json");
const UPDATE = process.argv.includes("--update");

const vocab = JSON.parse(readFileSync(VOCAB_PATH, "utf8"));
const PLACEHOLDER = /\{\{?[^}]*\}?\}/g;

const word = (term) => new RegExp(`(?<![a-z-])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i");
const BANNED = Object.entries(vocab.banned).map(([term, say]) => ({ term, say, re: word(term) }));
const PHRASAL = vocab.phrasalVerbs.map((term) => ({ term, re: word(term) }));
const CONNECTORS = vocab.formalConnectors.map((term) => ({ term, re: word(term) }));
const IDIOMS = vocab.idioms.map((term) => ({ term, re: word(term) }));
const EMPTY = new Set(vocab.emptyStates);

function walk(node, path, out) {
  if (typeof node === "string") out.push([path, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, out));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

function readNamespace(dir, name) {
  const file = join(dir, name);
  if (!existsSync(file)) return null;
  return walk(JSON.parse(readFileSync(file, "utf8")), "", []);
}

const violations = [];
const namespaces = readdirSync(EN_DIR).filter((f) => f.endsWith(".json")).sort();

for (const file of namespaces) {
  const ns = file.replace(/\.json$/, "");
  const en = readNamespace(EN_DIR, file) ?? [];
  const arEntries = readNamespace(AR_DIR, file);
  const arKeys = new Set((arEntries ?? []).map(([k]) => k));

  for (const [key, raw] of en) {
    const text = raw.replace(PLACEHOLDER, " ");
    if (!/[A-Za-z]{2}/.test(text)) continue;
    const add = (rule, message) => violations.push({ ns, key, rule, message, text: raw.slice(0, 120) });

    for (const { term, say, re } of BANNED) {
      if (re.test(text)) add("banned-word", say ? `"${term}" — say "${say}"` : `"${term}" — delete it`);
    }
    for (const { term, re } of PHRASAL) if (re.test(text)) add("phrasal-verb", `"${term}" — use one plain verb`);
    for (const { term, re } of CONNECTORS) if (re.test(text)) add("formal-connector", `"${term}" — use if / but / so / until`);
    for (const { term, re } of IDIOMS) if (re.test(text)) add("idiom", `"${term}" — say it literally`);

    if (EMPTY.has(raw.trim().toLowerCase())) add("empty-state", `"${raw.trim()}" — show an em dash instead`);

    const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim());
    for (const sentence of sentences) {
      const count = (sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
      if (count > vocab.maxSentenceWords) {
        add("long-sentence", `${count} words — the cap is ${vocab.maxSentenceWords}`);
        break;
      }
    }

    if (arEntries !== null && !arKeys.has(key)) add("no-arabic", "this key has no Arabic translation");
    if (arEntries === null) add("no-arabic", `there is no ar/${file} at all`);
  }
}

const counts = {};
for (const v of violations) {
  const id = `${v.ns}::${v.rule}`;
  counts[id] = (counts[id] ?? 0) + 1;
}

if (UPDATE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(counts, null, 2)}\n`);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Content baseline written — ${total} known violation(s) across ${namespaces.length} namespaces.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : {};
const totalNow = Object.values(counts).reduce((a, b) => a + b, 0);
const totalBaseline = Object.values(baseline).reduce((a, b) => a + b, 0);

const fresh = [];
for (const [id, actual] of Object.entries(counts)) {
  const allowed = baseline[id] ?? 0;
  if (actual > allowed) {
    const [ns, rule] = id.split("::");
    fresh.push(...violations.filter((v) => v.ns === ns && v.rule === rule).slice(allowed));
  }
}

if (fresh.length > 0) {
  console.error(`\nContent gate FAILED — ${fresh.length} new violation(s).`);
  console.error("Standard: brain/web/rules/WEB-016-content-and-voice.md\n");
  const byRule = {};
  for (const v of fresh) (byRule[v.rule] ??= []).push(v);
  for (const [rule, entries] of Object.entries(byRule)) {
    console.error(`  [${rule}]`);
    for (const e of entries) {
      console.error(`    ${e.ns}.${e.key}`);
      console.error(`      ${e.message}`);
      console.error(`      ${e.text}`);
    }
    console.error("");
  }
  process.exit(1);
}

if (totalNow < totalBaseline) {
  console.log(`Content gate PASSED — ${totalBaseline - totalNow} violation(s) removed since the baseline.`);
  console.log("Run `npm run gates:content -- --update` to lock the improvement in.");
} else {
  console.log(`Content gate PASSED — ${totalNow} known violation(s) remaining, none new.`);
}
