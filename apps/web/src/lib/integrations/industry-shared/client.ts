import "server-only";

import { INDUSTRY_SHARED_ENDPOINTS } from "./endpoints";
import { industrySharedContractNotSupplied } from "./errors";
import type { IndustrySharedEndpointKey, IndustrySharedResult } from "./types";

/**
 * Contract gate for the developer-supplied Industry Shared endpoint leads.
 *
 * No network request is possible until the selected endpoint ledger row has an
 * observed method, auth contract, request schema, response schema and sanitized
 * fixture checksum. This intentionally prevents a path name from becoming an
 * inferred GET/POST or from inheriting the unrelated /api/inspection auth mode.
 */
export function unavailableIndustrySharedEndpoint<T>(
  endpoint: IndustrySharedEndpointKey,
  domain: string,
): IndustrySharedResult<T> {
  const contract = INDUSTRY_SHARED_ENDPOINTS[endpoint];
  if (contract.state !== "DISCOVERY_REQUIRED") {
    throw new Error("Verified Industry Shared contracts require a schema-validating adapter before use.");
  }
  return industrySharedContractNotSupplied(endpoint, domain);
}
