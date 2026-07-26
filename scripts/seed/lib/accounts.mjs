import { createHash } from "node:crypto";

export const CANONICAL_ROLES = Object.freeze([
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "risk_owner",
  "gis_admin",
  "security_admin",
  "planner",
  "inspector",
  "reviewer",
  "ops",
  "auditor",
  "leadership",
  "factory_rep",
]);

function deterministicUuid(input) {
  const bytes = createHash("sha256").update(input).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function buildAccountPlan(seedBatchId) {
  if (!seedBatchId?.trim()) throw new Error("SEED_BATCH_ID is required");
  return CANONICAL_ROLES.flatMap(roleKey =>
    [1, 2, 3].map(ordinal => {
      const suffix = String(ordinal).padStart(2, "0");
      const alias = `${roleKey}-${suffix}`;
      return Object.freeze({
        id: deterministicUuid(`${seedBatchId}:auth-user:${roleKey}:${suffix}`),
        alias,
        role_key: roleKey,
        ordinal,
        email: `${alias.replaceAll("_", "-")}@mim-inspection.test`,
        full_name_en: `Demo ${roleKey.replaceAll("_", " ")} ${suffix}`,
        full_name_ar: `حساب تجريبي ${suffix}`,
        employee_ref: `DEMO-${roleKey.toUpperCase()}-${suffix}`,
        data_mode: "REALISTIC_SYNTHETIC",
      });
    }),
  );
}
