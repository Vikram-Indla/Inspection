/** Cross-cutting provider-error boundary: diagnostics stay server-side. */
export type ProviderError = { message?: unknown; code?: unknown; details?: unknown; hint?: unknown } | Error | unknown;

export function logProviderError(scope: string, error: ProviderError): void {
  console.error(`[${scope}]`, error);
}

export const NEUTRAL_LOAD_ERROR = "The requested data is temporarily unavailable. Nothing was changed. Try again.";
export const NEUTRAL_WRITE_ERROR = "The change could not be saved. Nothing was changed. Try again.";
