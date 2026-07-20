import type { IndustrySharedEndpointKey, IndustrySharedUnavailable } from "./types";

export const INDUSTRY_SHARED_CONTRACT_NOT_SUPPLIED = "INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED" as const;

export function industrySharedContractNotSupplied(
  endpoint: IndustrySharedEndpointKey,
  domain: string,
): IndustrySharedUnavailable {
  return {
    status: "not_configured",
    code: INDUSTRY_SHARED_CONTRACT_NOT_SUPPLIED,
    endpoint,
    domain,
    message: `The Industry Shared API contract for ${domain} has not been supplied.`,
    data: null,
  };
}
