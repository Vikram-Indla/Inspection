import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedUser } from "@/lib/verified-user";
import { ANALYTICS_ROLES,type AnalyticsQuery,type AnalyticsRpcRow } from "./contract";
type Loaded={kind:"ok"|"degraded";rows:AnalyticsRpcRow[];refreshedAt:string;stale:boolean};
export async function loadAnalytics(sb:SupabaseClient,q:AnalyticsQuery):Promise<Loaded|{kind:"unauthorized"}|{kind:"error";message:string}>{
  const {data:{user},error}=await getVerifiedUser(sb); if(error||!user)return{kind:"unauthorized"};
  const roles=await sb.from("user_roles").select("role_key").eq("user_id",user.id);
  if(roles.error||!(roles.data??[]).some(r=>ANALYTICS_ROLES.includes(r.role_key as never)))return{kind:"unauthorized"};
  const read=await sb.rpc("analytics_metric_snapshot",{p_period_from:`${q.periodFrom}T00:00:00Z`,p_period_to:`${q.periodTo}T23:59:59.999Z`,p_region:q.region,p_factory_id:q.factoryId,p_method:q.method,p_status:q.status,p_group_by:q.groupBy,p_visit_status:q.visitStatus,p_review_status:q.reviewStatus});
  if(read.error)return{kind:"error",message:"The governed analytics read failed. No failed source was represented as zero."};
  const rows=(read.data??[]) as AnalyticsRpcRow[],refreshedAt=rows[0]?.refreshed_at??new Date().toISOString(),affected=rows.find(r=>r.source_status==="unavailable");
  // The failing source names a database object, so it is diagnostic, not copy
  // (WEB-008 §2). It is logged for an operator and never returned to the view.
  if(affected)console.warn(`[analytics.loader] source unavailable: ${affected.unavailable_reason??affected.metric_key}`);
  return{kind:affected?"degraded":"ok",rows,refreshedAt,stale:rows.some(r=>r.source_status==="stale")};
}
