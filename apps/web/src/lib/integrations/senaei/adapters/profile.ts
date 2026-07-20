import { failed, forwardUnavailable } from "../errors";
import { parseProfile } from "../schemas";
import type { DomainResult, SenaeiClient, SenaeiUserProfile } from "../types";

export async function getProfile(client: SenaeiClient): Promise<DomainResult<SenaeiUserProfile>> {
  const result = await client.requestJson("/api/inspection/profile");
  if (result.status !== "available") return forwardUnavailable(result);
  try { return { status: "available", data: parseProfile(result.data), source: "senaei", fetchedAt: result.fetchedAt }; }
  catch { return failed("SENAEI_INVALID_RESPONSE", "Senaei profile did not match the documented contract."); }
}
