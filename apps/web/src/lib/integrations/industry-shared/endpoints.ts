import type { IndustrySharedEndpointKey, IndustrySharedEndpointLead, IndustrySharedObservedMethod } from "./types";

const HOST = "beta-backoffice.industry.sa" as const;

export const INDUSTRY_SHARED_ENDPOINTS = {
  license_info: lead("ISH-API-001", "license_info", "/shared/api/v2/license-info", "POST"),
  license_info_products: lead("ISH-API-002", "license_info_products", "/shared/api/v2/license-info/products", "POST"),
  license_info_preview: lead("ISH-API-003", "license_info_preview", "/shared/api/v2/license-info/preview", "POST"),
  job_workforce_info: lead("ISH-API-004", "job_workforce_info", "/shared/api/v2/job-workforce-info", null),
  contact_list: lead("ISH-API-005", "contact_list", "/shared/api/v2/contact-list", null),
  plants: lead("ISH-API-006", "plants", "/shared/api/v2/plants", null),
  plant_with_labors: lead("ISH-API-007", "plant_with_labors", "/shared/api/v2/plant-with-labors", null),
  is_industrial_activity: lead("ISH-API-008", "is_industrial_activity", "/shared/api/v2/is-industrial-activity", "POST"),
  get_industrial_activities: lead("ISH-API-009", "get_industrial_activities", "/shared/api/v2/get-industrial-activities", "POST"),
  delegations: lead("ISH-API-010", "delegations", "/shared/api/v2/delegations", null),
  hrsd_labors: lead("ISH-API-011", "hrsd_labors", "/shared/api/v2/hrsd-labors", null),
} as const satisfies Record<IndustrySharedEndpointKey, IndustrySharedEndpointLead>;

function lead(
  id: IndustrySharedEndpointLead["id"],
  key: IndustrySharedEndpointKey,
  path: IndustrySharedEndpointLead["path"],
  method: IndustrySharedObservedMethod | null,
): IndustrySharedEndpointLead {
  return {
    id,
    key,
    host: HOST,
    path,
    method,
    authContract: null,
    requestContract: null,
    responseContract: null,
    sanitizedFixtureSha256: null,
    state: "DISCOVERY_REQUIRED",
    privacyClass: "UNKNOWN_UNTIL_CONTRACT_VERIFIED",
  };
}
