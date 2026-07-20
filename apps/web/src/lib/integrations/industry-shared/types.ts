export type IndustrySharedEndpointKey =
  | "license_info"
  | "license_info_products"
  | "license_info_preview"
  | "job_workforce_info"
  | "contact_list"
  | "plants"
  | "plant_with_labors"
  | "is_industrial_activity"
  | "get_industrial_activities"
  | "delegations"
  | "hrsd_labors";

export type IndustrySharedContractState = "DISCOVERY_REQUIRED" | "CONTRACT_VERIFIED";

export type IndustrySharedObservedMethod = "POST";

export type IndustrySharedEndpointLead = {
  readonly id: `ISH-API-${string}`;
  readonly key: IndustrySharedEndpointKey;
  readonly host: "beta-backoffice.industry.sa";
  readonly path: `/shared/api/v2/${string}`;
  readonly method: IndustrySharedObservedMethod | null;
  readonly authContract: null;
  readonly requestContract: null;
  readonly responseContract: null;
  readonly sanitizedFixtureSha256: null;
  readonly state: "DISCOVERY_REQUIRED";
  readonly privacyClass: "UNKNOWN_UNTIL_CONTRACT_VERIFIED";
};

export type IndustrySharedUnavailable = {
  readonly status: "not_configured";
  readonly code: "INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED";
  readonly endpoint: IndustrySharedEndpointKey;
  readonly domain: string;
  readonly message: string;
  readonly data: null;
};

export type IndustrySharedResult<T> =
  | { readonly status: "available"; readonly source: "industry_shared"; readonly fetchedAt: string; readonly data: T }
  | IndustrySharedUnavailable
  | { readonly status: "degraded"; readonly code: string; readonly message: string; readonly retryable: boolean; readonly data: T | null }
  | { readonly status: "failed"; readonly code: string; readonly message: string; readonly retryable: boolean; readonly data: null };
