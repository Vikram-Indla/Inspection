// TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 · AC-0130/0137/0156
// The production adapters intentionally return unavailable until DEC-008 and
// the governed Operations approval integration are configured. Deterministic
// test adapters exercise the complete UI/data path without becoming product
// truth. Callers must display estimate.mode/provider and never hide test_stub.

export type FieldIntegrationMode = "production" | "test_stub";

export type RouteEstimate = {
  etaMinutes: number;
  remainingDistanceM: number;
  estimatedAt: string;
  provider: string;
  mode: FieldIntegrationMode;
  refreshAfterMs: number;
  stale?: boolean;
};

export type RouteEstimateResult =
  | { status: "available"; estimate: RouteEstimate }
  | { status: "unavailable"; reason: "provider_not_configured" | "offline" | "invalid_position" };

export type OverrideDecisionResult =
  | { status: "approved"; provider: string; mode: "test_stub"; decidedAt: string }
  | { status: "unavailable"; reason: "approval_provider_not_configured" };

export const TEST_STUB_LABEL = "TEST STUB — not production routing/approval";

function validCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function estimateFieldRoute(input: {
  mode: FieldIntegrationMode;
  online: boolean;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  straightDistanceM: number;
}): Promise<RouteEstimateResult> {
  if (!input.online) return { status: "unavailable", reason: "offline" };
  if (!validCoordinate(input.origin.lat, -90, 90) || !validCoordinate(input.origin.lng, -180, 180)
      || !validCoordinate(input.destination.lat, -90, 90) || !validCoordinate(input.destination.lng, -180, 180)
      || !Number.isFinite(input.straightDistanceM) || input.straightDistanceM < 0) {
    return { status: "unavailable", reason: "invalid_position" };
  }
  if (input.mode !== "test_stub") {
    return { status: "unavailable", reason: "provider_not_configured" };
  }

  // Test-fixture model only. These numbers deliberately live inside the named
  // stub and have no production/business meaning: modest route detour plus a
  // fixed test speed makes browser runs deterministic and fast to refresh.
  const remainingDistanceM = Math.max(0, Math.round(input.straightDistanceM * 1.18 + 250));
  const testMetresPerMinute = 35_000 / 60;
  const etaMinutes = remainingDistanceM === 0 ? 0 : Math.max(1, Math.ceil(remainingDistanceM / testMetresPerMinute));
  return {
    status: "available",
    estimate: {
      etaMinutes,
      remainingDistanceM,
      estimatedAt: new Date().toISOString(),
      provider: "deterministic-test-routing",
      mode: "test_stub",
      refreshAfterMs: 5_000,
    },
  };
}

export async function requestFieldLocationOverride(input: {
  mode: FieldIntegrationMode;
  reason: string;
  actual: { lat: number; lng: number; accuracyM: number };
}): Promise<OverrideDecisionResult> {
  if (input.mode !== "test_stub") {
    return { status: "unavailable", reason: "approval_provider_not_configured" };
  }
  if (!input.reason.trim()) {
    return { status: "unavailable", reason: "approval_provider_not_configured" };
  }
  return {
    status: "approved",
    provider: "simulated-operations-approval",
    mode: "test_stub",
    decidedAt: new Date().toISOString(),
  };
}
