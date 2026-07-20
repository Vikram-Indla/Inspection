import type { IndustrySharedEndpointKey, IndustrySharedEndpointLead } from "./types";

const HOST = "beta-backoffice.industry.sa" as const;

export const INDUSTRY_SHARED_ENDPOINTS = {
  license_info: lead("ISH-API-001", "license_info", "/shared/api/v2/license-info"),
  license_info_products: lead("ISH-API-002", "license_info_products", "/shared/api/v2/license-info/products"),
  license_info_preview: lead("ISH-API-003", "license_info_preview", "/shared/api/v2/license-info/preview"),
  job_workforce_info: lead("ISH-API-004", "job_workforce_info", "/shared/api/v2/job-workforce-info"),
  contact_list: lead("ISH-API-005", "contact_list", "/shared/api/v2/contact-list"),
  plants: lead("ISH-API-006", "plants", "/shared/api/v2/plants"),
  plant_with_labors: lead("ISH-API-007", "plant_with_labors", "/shared/api/v2/plant-with-labors"),
  is_industrial_activity: lead("ISH-API-008", "is_industrial_activity", "/shared/api/v2/is-industrial-activity"),
  get_industrial_activities: lead("ISH-API-009", "get_industrial_activities", "/shared/api/v2/get-industrial-activities"),
  delegations: lead("ISH-API-010", "delegations", "/shared/api/v2/delegations"),
  hrsd_labors: lead("ISH-API-011", "hrsd_labors", "/shared/api/v2/hrsd-labors"),
} as const satisfies Record<IndustrySharedEndpointKey, IndustrySharedEndpointLead>;

function lead(
  id: IndustrySharedEndpointLead["id"],
  key: IndustrySharedEndpointKey,
  path: IndustrySharedEndpointLead["path"],
): IndustrySharedEndpointLead {
  return {
    id,
    key,
    host: HOST,
    path,
    method: null,
    authContract: null,
    requestContract: null,
    responseContract: null,
    sanitizedFixtureSha256: null,
    state: "DISCOVERY_REQUIRED",
    privacyClass: "UNKNOWN_UNTIL_CONTRACT_VERIFIED",
  };
}
