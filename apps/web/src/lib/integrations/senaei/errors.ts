import type { DomainResult } from "./types";

export const SENAEI_CONTRACT_NOT_SUPPLIED = "SENAEI_API_CONTRACT_NOT_SUPPLIED" as const;
export type SenaeiErrorCode = "SENAEI_AUTH_MODE_REQUIRED" | "SENAEI_PUBLIC_AUTH_MODE_UNCONFIRMED" | "SENAEI_CREDENTIAL_MISSING" | "SENAEI_BASE_URL_INVALID" | "SENAEI_HOST_NOT_ALLOWED" | "SENAEI_PATH_NOT_ALLOWED" | "SENAEI_REQUEST_INVALID" | "SENAEI_TIMEOUT" | "SENAEI_NETWORK_ERROR" | "SENAEI_HTTP_ERROR" | "SENAEI_RESPONSE_TOO_LARGE" | "SENAEI_INVALID_JSON" | "SENAEI_INVALID_RESPONSE" | "SENAEI_PRODUCTION_LINE_METHOD_UNCONFIRMED";
export const failed = <T>(code: SenaeiErrorCode, message: string, retryable = false): DomainResult<T> => ({ status: "failed", data: null, code, message, retryable });
export const degraded = <T>(code: SenaeiErrorCode, message: string, data: T | null = null, retryable = true): DomainResult<T> => ({ status: "degraded", data, code, message, retryable });
export function contractNotSupplied<T>(domain: string): DomainResult<T> { return { status: "not_configured", code: SENAEI_CONTRACT_NOT_SUPPLIED, domain, message: `The Senaei API contract for ${domain} has not been supplied.`, data: null }; }
export function configurationMissing<T>(code: SenaeiErrorCode, domain: string, message: string): DomainResult<T> { return { status: "not_configured", code, domain, message, data: null }; }
export function forwardUnavailable<T>(result: DomainResult<unknown>): DomainResult<T> {
  if (result.status === "available") return failed("SENAEI_INVALID_RESPONSE", "An available result cannot be forwarded without schema validation.");
  if (result.status === "degraded") return { ...result, data: null };
  return result;
}
