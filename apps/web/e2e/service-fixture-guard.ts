export const ALLOWED_NONPRODUCTION_PROJECT_REF = "iiozvqntawxfwbgffzqu";
export const NONPRODUCTION_FIXTURE_ACK = "SAQEEL_NONPRODUCTION_FIXTURES_ACK";

export type ServiceFixtureGuardInput = {
  acknowledgement?: string;
  supabaseUrl?: string;
  configuredProjectRef?: string;
  serviceRoleKey?: string;
};

export type ServiceFixtureGuardResult =
  | { allowed: true; projectRef: typeof ALLOWED_NONPRODUCTION_PROJECT_REF }
  | { allowed: false; code: string };

/**
 * Test-harness boundary only. The privileged fixture client is unavailable
 * unless the caller opts in explicitly and the configured Supabase URL maps
 * to the one allowlisted private non-production project.
 */
export function guardServiceFixtureEnvironment(input: ServiceFixtureGuardInput): ServiceFixtureGuardResult {
  if (input.acknowledgement !== "1") {
    return { allowed: false, code: "FIXTURE_GUARD_ACK_REQUIRED" };
  }
  if (!input.serviceRoleKey?.trim()) {
    return { allowed: false, code: "FIXTURE_GUARD_SERVICE_ROLE_REQUIRED" };
  }

  let url: URL;
  try {
    url = new URL(input.supabaseUrl ?? "");
  } catch {
    return { allowed: false, code: "FIXTURE_GUARD_PROJECT_URL_INVALID" };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port
      || url.pathname !== "/" || url.search || url.hash) {
    return { allowed: false, code: "FIXTURE_GUARD_PROJECT_URL_INVALID" };
  }
  const match = url.hostname.toLowerCase().match(/^([a-z0-9]+)\.supabase\.co$/);
  if (!match || match[1] !== ALLOWED_NONPRODUCTION_PROJECT_REF) {
    return { allowed: false, code: "FIXTURE_GUARD_PROJECT_NOT_ALLOWED" };
  }
  if (input.configuredProjectRef?.trim()
      && input.configuredProjectRef.trim() !== match[1]) {
    return { allowed: false, code: "FIXTURE_GUARD_PROJECT_REFERENCE_MISMATCH" };
  }
  return { allowed: true, projectRef: ALLOWED_NONPRODUCTION_PROJECT_REF };
}
