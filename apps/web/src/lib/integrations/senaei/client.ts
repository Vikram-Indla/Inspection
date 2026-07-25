import "server-only";

import { SENAEI_API_ROOT, SENAEI_API_ROOT_V3_PUBLIC, SENAEI_CONTRACT_ENDPOINTS } from "./contract";
import { configurationMissing, degraded, failed, forwardUnavailable } from "./errors";
import type { DomainResult, RequestOptions, SenaeiAuthMode, SenaeiClient, SenaeiClientConfig, SenaeiPublicEndpointAuthMode } from "./types";

const API_ROOT = SENAEI_API_ROOT;
const API_ROOT_V3_PUBLIC = SENAEI_API_ROOT_V3_PUBLIC;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_JSON_BYTES = 2_000_000;
// The runtime allow-list and the admin-facing contract registry are the same
// list by construction (./contract.ts) — the console cannot drift from what the
// client will actually permit.
const KNOWN_ENDPOINTS: readonly { method: "GET" | "POST"; path: RegExp }[] = SENAEI_CONTRACT_ENDPOINTS;

function positiveInt(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}
function allowedHostname(hostname: string, suffix: string): boolean { return hostname === suffix || hostname.endsWith(`.${suffix}`); }

export function resolveSenaeiConfig(env: NodeJS.ProcessEnv = process.env): DomainResult<SenaeiClientConfig> {
  const authMode = env.SENAEI_AUTH_MODE;
  if (authMode !== "api_key" && authMode !== "bearer") return configurationMissing("SENAEI_AUTH_MODE_REQUIRED", "authentication", "Senaei authentication is disabled until SENAEI_AUTH_MODE is explicitly set to api_key or bearer.");
  const allowedHostSuffix = env.SENAEI_ALLOWED_HOST_SUFFIX?.trim().toLowerCase();
  if (!allowedHostSuffix || allowedHostSuffix.includes(":") || allowedHostSuffix.includes("/") || allowedHostSuffix.includes("*")) return configurationMissing("SENAEI_HOST_NOT_ALLOWED", "authentication", "Senaei is disabled until SENAEI_ALLOWED_HOST_SUFFIX contains one explicit DNS suffix.");
  let baseUrl: URL;
  try { baseUrl = new URL(env.SENAEI_BASE_URL ?? ""); }
  catch { return failed("SENAEI_BASE_URL_INVALID", "Senaei base URL is invalid."); }
  if (baseUrl.protocol !== "https:" || !allowedHostname(baseUrl.hostname.toLowerCase(), allowedHostSuffix)) return failed("SENAEI_HOST_NOT_ALLOWED", "Senaei base URL must use HTTPS and match the configured host suffix.");
  if (baseUrl.username || baseUrl.password || (baseUrl.pathname !== "/" && baseUrl.pathname !== "")) return failed("SENAEI_BASE_URL_INVALID", "Senaei base URL must not contain credentials or a path.");
  const publicMode = env.SENAEI_PUBLIC_ENDPOINT_AUTH_MODE;
  const publicEndpointAuthMode: SenaeiPublicEndpointAuthMode | null = publicMode === "api_key" || publicMode === "none" ? publicMode : null;
  return { status: "available", source: "senaei", fetchedAt: new Date().toISOString(), data: { baseUrl, allowedHostSuffix, authMode: authMode as SenaeiAuthMode, publicEndpointAuthMode, apiKey: env.SENAEI_API_KEY?.trim() || null, bearerToken: env.SENAEI_BEARER_TOKEN?.trim() || null, timeoutMs: positiveInt(env.SENAEI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 60_000), maxJsonBytes: positiveInt(env.SENAEI_MAX_JSON_BYTES, DEFAULT_MAX_JSON_BYTES, 10_000_000), getRetryCount: positiveInt(env.SENAEI_GET_ATTEMPTS, 2, 3) - 1, productionLineMode: env.SENAEI_PRODUCTION_LINE_MODE === "get_query" ? "get_query" : null } };
}

function validatePath(path: string, method: "GET" | "POST"): string | null {
  const onKnownRoot = path.startsWith(`${API_ROOT}/`) || path === API_ROOT || path.startsWith(`${API_ROOT_V3_PUBLIC}/`);
  if (!onKnownRoot) return null;
  if (path.includes("?") || path.includes("#") || path.includes("\\") || path.split("/").includes("..")) return null;
  return KNOWN_ENDPOINTS.some(endpoint => endpoint.method === method && endpoint.path.test(path)) ? path : null;
}
const retryableStatus = (status: number) => status === 408 || status === 429 || status >= 500;

async function readBoundedText(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) return output + decoder.decode();
    bytes += value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); return null; }
    output += decoder.decode(value, { stream: true });
  }
}

export function createSenaeiClient(config: SenaeiClientConfig, fetchImpl: typeof fetch = fetch): SenaeiClient {
  return { productionLineMode: config.productionLineMode, publicEndpointAuthMode: config.publicEndpointAuthMode, async requestJson(path: string, options: RequestOptions = {}): Promise<DomainResult<unknown>> {
    const method = options.method ?? "GET";
    const safePath = validatePath(path, method);
    if (!safePath) return failed("SENAEI_PATH_NOT_ALLOWED", "Senaei request path or method is outside the documented API contract.");
    const url = new URL(safePath, config.baseUrl);
    for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    if (method === "GET" && options.body !== undefined) return failed("SENAEI_REQUEST_INVALID", "GET requests cannot include a body.");
    if (options.bodyKind === "multipart_form_data" && !(options.body instanceof FormData)) return failed("SENAEI_REQUEST_INVALID", "Multipart Senaei requests require caller-provided FormData.");
    const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": "en", ...options.headers };
    if (options.bodyKind === "multipart_form_data") {
      for (const key of Object.keys(headers)) if (key.toLowerCase() === "content-type") return failed("SENAEI_REQUEST_INVALID", "Multipart content type must be generated with its FormData boundary.");
    }
    const requestAuth = options.auth ?? "configured";
    if (requestAuth === "api_key") {
      if (!config.apiKey) return configurationMissing("SENAEI_CREDENTIAL_MISSING", "authentication", "Senaei API-key credentials are not configured.");
      headers["X-API-Key"] = config.apiKey;
    } else if (requestAuth === "configured" && config.authMode === "api_key") {
      if (!config.apiKey) return configurationMissing("SENAEI_CREDENTIAL_MISSING", "authentication", "Senaei API-key credentials are not configured.");
      headers["X-API-Key"] = config.apiKey;
    } else if (requestAuth === "configured") {
      if (!config.bearerToken) return configurationMissing("SENAEI_CREDENTIAL_MISSING", "authentication", "Senaei bearer credentials are not configured.");
      headers.Authorization = `Bearer ${config.bearerToken}`;
    }
    const attempts = method === "GET" ? config.getRetryCount + 1 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const response = await fetchImpl(url, { method, headers, body: options.body, signal: controller.signal, cache: "no-store" });
        const declaredLength = Number(response.headers.get("content-length") ?? 0);
        if (declaredLength > config.maxJsonBytes) return failed("SENAEI_RESPONSE_TOO_LARGE", "Senaei response exceeded the configured size limit.");
        if (!response.ok) {
          if (method === "GET" && retryableStatus(response.status) && attempt + 1 < attempts) continue;
          return degraded("SENAEI_HTTP_ERROR", `Senaei returned HTTP ${response.status}.`, null, retryableStatus(response.status));
        }
        const responseText = await readBoundedText(response, config.maxJsonBytes);
        if (responseText === null) return failed("SENAEI_RESPONSE_TOO_LARGE", "Senaei response exceeded the configured size limit.");
        try { return { status: "available", data: JSON.parse(responseText) as unknown, source: "senaei", fetchedAt: new Date().toISOString() }; }
        catch { return failed("SENAEI_INVALID_JSON", "Senaei returned an invalid JSON response."); }
      } catch (error) {
        const timeout = error instanceof Error && error.name === "AbortError";
        if (method === "GET" && attempt + 1 < attempts) continue;
        return degraded(timeout ? "SENAEI_TIMEOUT" : "SENAEI_NETWORK_ERROR", timeout ? "Senaei request timed out." : "Senaei request failed.", null, true);
      } finally { clearTimeout(timer); }
    }
    return failed("SENAEI_NETWORK_ERROR", "Senaei request failed.", true);
  } };
}

export function senaeiClientFromEnvironment(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): DomainResult<SenaeiClient> {
  const resolved = resolveSenaeiConfig(env);
  if (resolved.status !== "available") return forwardUnavailable(resolved);
  return { status: "available", data: createSenaeiClient(resolved.data, fetchImpl), source: "senaei", fetchedAt: resolved.fetchedAt };
}
