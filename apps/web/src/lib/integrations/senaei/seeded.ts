import "server-only";

import { SENAEI_CONTRACT_ENDPOINTS } from "./contract";
import type { DomainResult, RequestOptions, SenaeiClient } from "./types";

export const SEEDED_SENAEI_LABEL = "Seeded fixture — not live Senaei data";
export const SEEDED_SENAEI_FRESHNESS_LABEL = "Fixture timestamp — provider freshness not proven";
export const SEEDED_SENAEI_REGISTERED_PROJECTION_LABEL =
  "Registered canonical demo projection — seeded, not live Senaei";

/**
 * Approved synthetic factory codes whose canonical CR → licence → plant
 * projections are asserted by seed_planning_senaei_seeded_20260727.sql.
 * These are local fixture selectors, never Senaei identifiers.
 */
export const SEEDED_SENAEI_REGISTERED_FACTORY_CODES = [
  "F-3305",
  "F-4402",
  "F-5502",
  "F-6601",
  "F-6602",
] as const;

export const SEEDED_SENAEI_MODES = ["off", "fixture"] as const;
export type SeededSenaeiMode = (typeof SEEDED_SENAEI_MODES)[number];

export const SEEDED_SENAEI_SCENARIOS = [
  "not_configured",
  "degraded",
  "timeout",
  "invalid_response",
  "no_match",
  "duplicate",
] as const;
export type SeededSenaeiScenario = (typeof SEEDED_SENAEI_SCENARIOS)[number];

type SeededFixtureEnvelope = {
  fixture: true;
  provenance: typeof SEEDED_SENAEI_LABEL;
  scenario: SeededSenaeiScenario;
  requestKey: string;
  fetchedAt: string;
  records: never[];
};

const FIXTURE_TIMESTAMP = "2026-07-27T12:00:00.000Z";

function selectedMode(env: NodeJS.ProcessEnv): SeededSenaeiMode {
  return env.FEATURE_SENAEI_SEEDED_ADAPTER === "fixture" ? "fixture" : "off";
}

function selectedScenario(env: NodeJS.ProcessEnv): SeededSenaeiScenario {
  const value = env.SENAEI_SEEDED_SCENARIO;
  return SEEDED_SENAEI_SCENARIOS.includes(value as SeededSenaeiScenario)
    ? value as SeededSenaeiScenario
    : "not_configured";
}

function requestKey(path: string, method: "GET" | "POST"): string | null {
  return SENAEI_CONTRACT_ENDPOINTS.find(
    endpoint => endpoint.method === method && endpoint.path.test(path),
  )?.key ?? null;
}

function fixtureEnvelope(scenario: SeededSenaeiScenario, key: string): SeededFixtureEnvelope {
  return {
    fixture: true,
    provenance: SEEDED_SENAEI_LABEL,
    scenario,
    requestKey: key,
    fetchedAt: FIXTURE_TIMESTAMP,
    records: [],
  };
}

function resultForScenario(scenario: SeededSenaeiScenario, key: string): DomainResult<unknown> {
  const fixture = fixtureEnvelope(scenario, key);
  switch (scenario) {
    case "not_configured":
      return {
        status: "not_configured",
        data: null,
        code: "SENAEI_AUTH_MODE_REQUIRED",
        domain: "seeded fixture",
        message: `${SEEDED_SENAEI_LABEL}. Senaei is not configured in this environment.`,
      };
    case "degraded":
      return {
        status: "degraded",
        data: fixture,
        code: "SENAEI_HTTP_ERROR",
        message: `${SEEDED_SENAEI_LABEL}. The external source is degraded.`,
        retryable: true,
      };
    case "timeout":
      return {
        status: "degraded",
        data: fixture,
        code: "SENAEI_TIMEOUT",
        message: `${SEEDED_SENAEI_LABEL}. The simulated provider request timed out.`,
        retryable: true,
      };
    case "invalid_response":
      return {
        status: "failed",
        data: null,
        code: "SENAEI_INVALID_RESPONSE",
        message: `${SEEDED_SENAEI_LABEL}. The simulated response failed schema validation.`,
        retryable: false,
      };
    case "no_match":
      return {
        status: "degraded",
        data: fixture,
        code: "SENAEI_INVALID_RESPONSE",
        message: `${SEEDED_SENAEI_LABEL}. No registry match was supplied; no master record was created.`,
        retryable: false,
      };
    case "duplicate":
      return {
        status: "degraded",
        data: fixture,
        code: "SENAEI_INVALID_RESPONSE",
        message: `${SEEDED_SENAEI_LABEL}. Duplicate candidates require human resolution; no record was selected.`,
        retryable: false,
      };
  }
}

/**
 * Test/staging-only provider-state adapter. It deliberately cannot return an
 * `available`/`source:"senaei"` result, because seeded fixtures are not proof
 * of provider connectivity or freshness. Planning's registered-factory data
 * continues to come from approved canonical database fixtures.
 */
export function seededSenaeiClientFromEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): DomainResult<SenaeiClient> {
  if (env.NODE_ENV === "production") {
    return {
      status: "not_configured",
      data: null,
      code: "SENAEI_AUTH_MODE_REQUIRED",
      domain: "seeded fixture",
      message: "Seeded Senaei fixtures are disabled in production.",
    };
  }
  if (selectedMode(env) === "off") {
    return {
      status: "not_configured",
      data: null,
      code: "SENAEI_AUTH_MODE_REQUIRED",
      domain: "seeded fixture",
      message: "Seeded Senaei fixtures are off.",
    };
  }

  const client = seededSenaeiClientForTesting(env);
  if (!client) {
    return {
      status: "not_configured",
      data: null,
      code: "SENAEI_AUTH_MODE_REQUIRED",
      domain: "seeded fixture",
      message: "Seeded Senaei fixtures are off.",
    };
  }

  return {
    status: "degraded",
    data: client,
    code: "SENAEI_HTTP_ERROR",
    message: `${SEEDED_SENAEI_LABEL}. Fixture mode is enabled; live provider availability is not proven.`,
    retryable: false,
  };
}

/** Direct fixture client for contract tests and seed tooling only. */
export function seededSenaeiClientForTesting(
  env: NodeJS.ProcessEnv,
): SenaeiClient | null {
  if (env.NODE_ENV === "production" || selectedMode(env) === "off") return null;
  const scenario = selectedScenario(env);
  return {
    productionLineMode: null,
    publicEndpointAuthMode: null,
    async requestJson(path: string, options: RequestOptions = {}): Promise<DomainResult<unknown>> {
      const method = options.method ?? "GET";
      const key = requestKey(path, method);
      if (!key) {
        return {
          status: "failed",
          data: null,
          code: "SENAEI_PATH_NOT_ALLOWED",
          message: `${SEEDED_SENAEI_LABEL}. The path or method is outside the documented contract.`,
          retryable: false,
        };
      }
      return resultForScenario(scenario, key);
    },
  };
}
