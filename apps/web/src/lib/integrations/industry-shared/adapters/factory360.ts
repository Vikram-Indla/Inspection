import { unavailableIndustrySharedEndpoint } from "../client";
import type { IndustrySharedEndpointKey, IndustrySharedResult } from "../types";

export const INDUSTRY_SHARED_FACTORY360_DOMAINS = {
  license_info: "license master and CR/license hierarchy",
  license_info_products: "licensed product master",
  license_info_preview: "license preview aggregate",
  job_workforce_info: "job workforce information",
  contact_list: "permission-sensitive operational contacts",
  plants: "plant list and human-readable labels",
  plant_with_labors: "plant and workforce aggregate",
  is_industrial_activity: "industrial activity validation",
  get_industrial_activities: "industrial activity catalogue",
  delegations: "authorized delegation history",
  hrsd_labors: "HRSD workforce information",
} as const satisfies Record<IndustrySharedEndpointKey, string>;

export function unavailableFactory360IndustrySharedDomain<T>(
  endpoint: IndustrySharedEndpointKey,
): IndustrySharedResult<T> {
  return unavailableIndustrySharedEndpoint(endpoint, INDUSTRY_SHARED_FACTORY360_DOMAINS[endpoint]);
}
