// Governed Senaei endpoint contract — the single registry of documented paths.
//
// This module is the source of truth for BOTH the runtime allow-list enforced by
// `client.validatePath` and the admin-facing SENAI data console
// (/admin/integrations/senai-data). Extracting it means the console can never
// display an endpoint the client would refuse, and can never omit one it allows.
//
// FND-007: SAQEEL does not write establishment/factory master data back to
// Senaei. No POST in this registry targets factory, licence, plant, CR or
// address master data. The one outbound POST family (inspection submission) is
// an inspection result forward and is itself governed OFF at the adapter
// (BLOCKED_TRIGGER_DECISION) — see adapters/inspection-submission.ts.
//
// Nothing here asserts connectivity. "Documented" is not "reachable"; live-call
// verification comes only from recorded `senaei_sync_calls` rows.

export const SENAEI_API_ROOT = "/api/inspection";
// Public (no-auth) v3 endpoints, chemicalcustoms.json contract — a separate root
// from the bearer/api_key-gated /api/inspection/* family. Every call against this
// root must pass { auth: "none" } explicitly (see adapters/factory360.ts).
export const SENAEI_API_ROOT_V3_PUBLIC = "/api/v3/inspection";

export type SenaeiEndpointDirection = "read" | "session" | "outbound_submission";

export type SenaeiContractEndpoint = {
  /** Stable key; matches `senaei_sync_calls.endpoint_key` when a call is recorded. */
  readonly key: string;
  readonly method: "GET" | "POST";
  /** Documented path template as published in the provider contract. */
  readonly template: string;
  /** Runtime allow-list pattern enforced by the client. */
  readonly path: RegExp;
  readonly purpose: string;
  readonly direction: SenaeiEndpointDirection;
  /** Which auth family the documented root belongs to. */
  readonly authFamily: "gated" | "public_v3";
  /**
   * Set only where a governance decision blocks the call regardless of
   * configuration. `null` means "not blocked by governance" — it does NOT mean
   * configured, reachable or verified.
   */
  readonly governanceBlock: string | null;
};

export const SENAEI_CONTRACT_ENDPOINTS: readonly SenaeiContractEndpoint[] = [
  {
    key: "POST /api/inspection/{session}",
    method: "POST",
    template: "/api/inspection/{login|logout|forgot-password|reset-password}",
    path: /^\/api\/inspection\/(?:login|logout|forgot-password|reset-password)$/,
    purpose: "Provider session lifecycle",
    direction: "session",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "GET /api/inspection/profile",
    method: "GET",
    template: "/api/inspection/profile",
    path: /^\/api\/inspection\/profile$/,
    purpose: "Authenticated provider user profile",
    direction: "read",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "GET /api/inspection/regulations",
    method: "GET",
    template: "/api/inspection/regulations/{id?}",
    path: /^\/api\/inspection\/regulations(?:\/[^/]+)?$/,
    purpose: "Regulations and regulation items",
    direction: "read",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "GET /api/inspection/tasks",
    method: "GET",
    template: "/api/inspection/tasks",
    path: /^\/api\/inspection\/tasks$/,
    purpose: "Inspection task list",
    direction: "read",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "GET /api/inspection/tasks/production-line",
    method: "GET",
    template: "/api/inspection/tasks/production-line",
    path: /^\/api\/inspection\/tasks\/production-line$/,
    purpose: "Products, raw materials, spare parts and machines",
    direction: "read",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "GET /api/inspection/tasks/{task}",
    method: "GET",
    template: "/api/inspection/tasks/{task}",
    path: /^\/api\/inspection\/tasks\/[^/]+$/,
    purpose: "Task detail — visit, plant, licence and CR identity",
    direction: "read",
    authFamily: "gated",
    governanceBlock: null,
  },
  {
    key: "POST /api/inspection/tasks/submit-inspection/{task}",
    method: "POST",
    template: "/api/inspection/tasks/submit-inspection/{task}",
    path: /^\/api\/inspection\/tasks\/submit-inspection\/[^/]+$/,
    purpose: "Inspection result forward (not master-data write-back)",
    direction: "outbound_submission",
    authFamily: "gated",
    governanceBlock: "BLOCKED_TRIGGER_DECISION",
  },
  {
    key: "GET /api/v3/inspection/plants",
    method: "GET",
    template: "/api/v3/inspection/plants",
    path: /^\/api\/v3\/inspection\/plants$/,
    purpose: "Industrial plants",
    direction: "read",
    authFamily: "public_v3",
    governanceBlock: null,
  },
  {
    key: "GET /api/v3/inspection/plants/{plant}/chemical-permits",
    method: "GET",
    template: "/api/v3/inspection/plants/{plant}/chemical-permits",
    path: /^\/api\/v3\/inspection\/plants\/[^/]+\/chemical-permits$/,
    purpose: "Chemical permits held by a plant",
    direction: "read",
    authFamily: "public_v3",
    governanceBlock: null,
  },
  {
    key: "GET /api/v3/inspection/plants/{plant}/customs-exemptions",
    method: "GET",
    template: "/api/v3/inspection/plants/{plant}/customs-exemptions",
    path: /^\/api\/v3\/inspection\/plants\/[^/]+\/customs-exemptions$/,
    purpose: "Customs exemptions held by a plant",
    direction: "read",
    authFamily: "public_v3",
    governanceBlock: null,
  },
];

/**
 * FND-007 assertion, derived rather than asserted: true only while no documented
 * endpoint writes establishment/factory master data back to the provider.
 */
export const SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS = SENAEI_CONTRACT_ENDPOINTS
  .filter(endpoint => endpoint.method !== "GET" && endpoint.direction !== "session" && endpoint.direction !== "outbound_submission");
