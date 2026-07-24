// Inspector field views (home, My Tasks, Establishments, Drafts, map) share the
// same database the Playwright e2e suite writes to. Those specs create
// throwaway establishments that must never surface as real assigned work.
//
// The match is deliberately NARROW — the structured factory_code prefixes and
// name prefixes the specs actually use — so genuine seed/demo establishments
// (F-* codes, the Al Ahsa Beverage factory-360 demo, any real CR record) are
// never hidden. Broad substring matching ("Draft", "Journey") is intentionally
// avoided for exactly that reason.
//
// PRIMARY, universal signature: every Playwright fixture embeds a 13-digit
// epoch-millisecond stamp (`${Date.now()}`, e.g. 1784697187613) in its name
// and/or factory_code. This is the one marker shared across ALL fixture
// families seen in the live DB — "CD-022 Draft Resume …", "G10 Golden Journey
// …", "G10 Debug/Repro …", "PLN-J expiry fixture …", "Inspector factory …",
// "Concurrent identity CR-B-…". Real establishments (named companies, IL-* / F-*
// codes) never contain a 13-digit run, so this cannot hide a genuine record.
// (Saudi CR numbers are 10 digits, and are not the establishment name.)
const FIXTURE_EPOCH = /\d{13}/;
// Secondary belt-and-suspenders for any prefixed fixture that lacked a stamp.
const FIXTURE_CODE = /^(CD0\d{2}-|G10-)/i;
// e2e/test establishment name families (aligned with the AI-briefing fixture
// filter in lib/ai/briefing.ts). Each is a phrasing the specs generate and a
// real establishment would not carry: the literal word "fixture", an
// "F360 Runtime <n>"/"Runtime <n>" scaffold, "PLN-J …" planning fixtures,
// "Inspector factory <n>", "Concurrent identity …", or an
// "Unregistered factory <hex-hash>" auto-name. Narrow enough not to hide a
// genuinely inspector-created unregistered establishment (which has a real name).
const FIXTURE_NAME = /^(CD-0\d{2}\b|G10 |Unregistered factory [0-9a-f]{6,}\b|Inspector factory \d|Concurrent identity\b|PLN-J\b)|\bfixture\b|\bruntime\s*\d/i;

/** True when an establishment is a Playwright e2e/seed fixture, not real work. */
export function isTestFixtureEstablishment(
  factory: { name?: string | null; factory_code?: string | null } | null | undefined,
): boolean {
  if (!factory) return false;
  const name = factory.name ?? "";
  const code = factory.factory_code ?? "";
  return FIXTURE_EPOCH.test(name) || FIXTURE_EPOCH.test(code)
    || FIXTURE_CODE.test(code) || FIXTURE_NAME.test(name);
}
