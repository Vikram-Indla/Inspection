// Factory-information verification — shared canon + query helper.
// (M04-095..114 · M04-190 · M06-017 · M06-034)
// Source values are Senaei-owned (FND-007): the module records observations in
// inspection_factory_checks and NEVER writes back to factories (M04-112).
//
// F2 HANDOFF (official report, /reports/inspection/[id]): call
//   fetchFactoryChecks(sb, inspectionId)
// and render the rows (field label via FACTORY_FIELD_EN + t(`field.fv.f.${key}`),
// before = source_value, after = observed_value, status verified|updated,
// updatedCount(checks) as the change counter). Tolerant of migration 0020
// being unapplied: `error` carries the verbatim message, `checks` stays [].

type MinimalClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, v: string) => {
        order: (col: string) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
};

export type FactoryCheckRow = {
  id: string;
  field_key: string;
  source_value: string | null;
  observed_value: string | null;
  status: "verified" | "updated";
  evidence_note: string | null;
  updated_at: string;
};

/** Verification field canon — source-owned factories columns (English defaults for t()). */
export const FACTORY_FIELD_EN: Record<string, string> = {
  name: "Factory name",                       // M04-097
  cr_number: "CR number",                     // M04-097
  license_number: "License number",           // M04-096
  activity_class: "Activity class",           // M04-097
  region: "Region",                           // M04-097
  city: "City",                               // M04-097
  employees_total: "Employees — total",       // M04-100
  employees_saudi: "Employees — Saudi",       // M04-100
  capital_invested: "Capital invested (SAR)", // M04-101
  production_capacity_note: "Production capacity", // M04-101
};

/** Tolerant fetch: a missing table (0020 pending) degrades to [] + a stable unavailable marker. */
export async function fetchFactoryChecks(sb: unknown, inspectionId: string): Promise<{ checks: FactoryCheckRow[]; error: string | null }> {
  const { data, error } = await (sb as MinimalClient)
    .from("inspection_factory_checks")
    .select("id, field_key, source_value, observed_value, status, evidence_note, updated_at")
    .eq("inspection_id", inspectionId)
    .order("field_key");
  if (error) console.error("[factory verification read]", error);
  return { checks: ((data ?? []) as FactoryCheckRow[]), error: error ? "unavailable" : null };
}

/** M04-110 — change counter: fields whose observed value differs from Senaei. */
export const updatedCount = (checks: FactoryCheckRow[]): number =>
  checks.filter(c => c.status === "updated").length;
