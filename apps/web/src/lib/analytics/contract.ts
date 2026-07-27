export const ANALYTICS_ROLES = ["leadership","ops","planner","reviewer","auditor"] as const;
export type AnalyticsQuery = {
  periodFrom:string; periodTo:string; compareFrom:string|null; compareTo:string|null;
  region:string|null; factoryId:string|null; method:"bulk"|"single"|"immediate"|null;
  status:string|null; visitStatus:string|null; reviewStatus:string|null;
  groupBy:"none"|"decision"|"compliance_result"; tab:"overview"; cursor:string|null;
};
export type AnalyticsRpcRow = {
  metric_key:string; source_status:"ok"|"stale"|"unavailable"|"not_applicable"|"not_configured"|"decision_required";
  value:number|null; numerator:number|null; denominator:number|null; breakdown:Record<string,unknown>|null;
  refreshed_at:string; unavailable_reason:string|null;
};
