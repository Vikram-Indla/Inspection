import { configurationMissing, failed, forwardUnavailable } from "../errors";
import { parseLogin, parseOperation } from "../schemas";
import type { DomainResult, SenaeiClient, SenaeiLoginResult, SenaeiOperationResult } from "../types";

function publicAuth(client: SenaeiClient): "api_key" | "none" | DomainResult<never> {
  return client.publicEndpointAuthMode ?? configurationMissing("SENAEI_PUBLIC_AUTH_MODE_UNCONFIRMED", "public authentication endpoints", "Senaei login and password endpoints are disabled until SENAEI_PUBLIC_ENDPOINT_AUTH_MODE is explicitly set to api_key or none.");
}
function multipart(values: Record<string, string>): FormData { const body = new FormData(); for (const [key, value] of Object.entries(values)) body.set(key, value); return body; }

export async function login(client: SenaeiClient, input: { email: string; password: string }): Promise<DomainResult<SenaeiLoginResult>> {
  if (!input.email.trim() || !input.password) return failed("SENAEI_REQUEST_INVALID", "Login email and password are required.");
  const auth = publicAuth(client); if (typeof auth !== "string") return auth;
  const result = await client.requestJson("/api/inspection/login", { method: "POST", auth, bodyKind: "multipart_form_data", body: multipart({ email: input.email, password: input.password }) });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseLogin(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei login did not match the documented contract."); }
}

export async function logout(client: SenaeiClient): Promise<DomainResult<SenaeiOperationResult>> {
  const result = await client.requestJson("/api/inspection/logout", { method: "POST", bodyKind: "multipart_form_data", body: new FormData() });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseOperation(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei logout did not match the documented contract."); }
}

export async function forgotPassword(client: SenaeiClient, email: string): Promise<DomainResult<SenaeiOperationResult>> {
  if (!email.trim()) return failed("SENAEI_REQUEST_INVALID", "Password-reset email is required.");
  const auth = publicAuth(client); if (typeof auth !== "string") return auth;
  const result = await client.requestJson("/api/inspection/forgot-password", { method: "POST", auth, bodyKind: "multipart_form_data", body: multipart({ email }) });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseOperation(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei forgot-password response did not match the documented contract."); }
}

export async function resetPassword(client: SenaeiClient, input: { email: string; code: string; password: string; passwordConfirmation: string }): Promise<DomainResult<SenaeiOperationResult>> {
  if (!input.email.trim() || !input.code.trim() || !input.password || input.password !== input.passwordConfirmation) return failed("SENAEI_REQUEST_INVALID", "Complete matching password-reset fields are required.");
  const auth = publicAuth(client); if (typeof auth !== "string") return auth;
  const result = await client.requestJson("/api/inspection/reset-password", { method: "POST", auth, bodyKind: "multipart_form_data", body: multipart({ email: input.email, code: input.code, password: input.password, password_confirmation: input.passwordConfirmation }) });
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseOperation(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei reset-password response did not match the documented contract."); }
}
