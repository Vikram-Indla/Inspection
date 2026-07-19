// TASK-FACTORY-360-COMPLETE-010 · F360-BR-007/009 · F360-LO-003/004
// F360-CR-001..005
// Compliance is derived only from an immutable approved submission snapshot and
// the matching frozen package item snapshot. Live catalogue rows are never used.

export type FrozenItem = {
  score_weight?: number | null;
  score_excluded_on?: string[] | null;
  response_model?: {
    scoring_enabled?: boolean;
    score_excluded_on?: string[];
    mapping?: Record<string, { result?: string }>;
  } | null;
};

export type ComplianceSnapshot = { answers?: Record<string, string> };
export type FrozenPackageDefinition = { item_snapshot?: Record<string, FrozenItem> };

export type ComplianceResult = {
  status: "available" | "not_available";
  passed: number;
  answered: number;
  rate: number | null;
};

export function calculateApprovedCompliance(
  snapshot: ComplianceSnapshot | null | undefined,
  definition: FrozenPackageDefinition | null | undefined,
): ComplianceResult {
  const answers = snapshot?.answers ?? {};
  const items = definition?.item_snapshot ?? {};
  let passed = 0;
  let answered = 0;

  for (const [code, value] of Object.entries(answers)) {
    if (!value) continue;
    const item = items[code];
    if (!item) continue; // no frozen scoring authority: exclude rather than guess
    const model = item.response_model ?? {};
    const exclusions = new Set(item.score_excluded_on ?? model.score_excluded_on ?? []);
    if (model.scoring_enabled === false || item.score_weight == null || Number(item.score_weight) <= 0 || exclusions.has(value)) continue;
    const result = model.mapping?.[value]?.result;
    if (!result || !["compliant", "non_compliant"].includes(result)) continue;
    answered += 1;
    if (result === "compliant") passed += 1;
  }

  if (!answered) return { status: "not_available", passed: 0, answered: 0, rate: null };
  return { status: "available", passed, answered, rate: Math.round((passed / answered) * 10000) / 100 };
}
