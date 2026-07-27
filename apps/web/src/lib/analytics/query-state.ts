import type { AnalyticsQuery } from "./contract";
type Input=Record<string,string|string[]|undefined>;
type Result={ok:true;value:AnalyticsQuery}|{ok:false;issues:string[]};
const KEYS=new Set(["periodFrom","periodTo","compareFrom","compareTo","region","factoryId","method","status","visitStatus","reviewStatus","groupBy","tab","cursor"]);
const METHODS=new Set(["bulk","single","immediate"]);
const GROUPS=new Set(["none","decision","compliance_result"]);
const STATUSES=new Set(["draft","published","cancelled","expired","new","prepared","on_the_way","arrived","executing","submitted","under_review","pending_review","approved","returned","rejected"]);
const VISIT_STATUSES=new Set(["draft","published","returned","cancelled","expired","new","prepared","on_the_way","arrived","executing","submitted","under_review"]);
const REVIEW_STATUSES=new Set(["pending_review","under_review","approved","returned","rejected"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/; const CURSOR=/^[A-Za-z0-9_-]{1,512}$/; const REGION=/^[\p{L}\p{N} .'-]{1,80}$/u;
const one=(v:string|string[]|undefined)=>typeof v==="string"?v:undefined;
const validDate=(v:string|undefined)=>!!v&&DATE.test(v)&&!Number.isNaN(Date.parse(`${v}T00:00:00Z`));
export function parseAnalyticsQuery(input:Input,now=new Date()):Result{
  const issues:string[]=[]; for(const k of Object.keys(input))if(!KEYS.has(k))issues.push(`Unsupported parameter: ${k}.`);
  for(const [k,v] of Object.entries(input))if(Array.isArray(v))issues.push(`${k} must occur once.`);
  const periodTo=one(input.periodTo)??now.toISOString().slice(0,10);
  const periodFrom=one(input.periodFrom)??new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-29)).toISOString().slice(0,10);
  const compareFrom=one(input.compareFrom)??null,compareTo=one(input.compareTo)??null;
  if(!validDate(periodFrom)||!validDate(periodTo)||periodFrom>periodTo)issues.push("Invalid or inverted period.");
  if((compareFrom===null)!==(compareTo===null)||(compareFrom&&!validDate(compareFrom))||(compareTo&&!validDate(compareTo))||(compareFrom&&compareTo&&compareFrom>compareTo))issues.push("Invalid comparison period.");
  const method=one(input.method)??null,status=one(input.status)??null,visitStatus=one(input.visitStatus)??null,reviewStatus=one(input.reviewStatus)??null,groupBy=one(input.groupBy)??"none",tab=one(input.tab)??"overview",region=one(input.region)??null,factoryId=one(input.factoryId)??null,cursor=one(input.cursor)??null;
  if(method&&!METHODS.has(method))issues.push("Invalid method."); if(status&&!STATUSES.has(status))issues.push("Invalid status.");
  if(status&&["returned","under_review"].includes(status))issues.push("Ambiguous legacy status; use visitStatus or reviewStatus.");
  if(visitStatus&&!VISIT_STATUSES.has(visitStatus))issues.push("Invalid visitStatus.");
  if(reviewStatus&&!REVIEW_STATUSES.has(reviewStatus))issues.push("Invalid reviewStatus.");
  if(status&&(visitStatus||reviewStatus))issues.push("Legacy status cannot be combined with domain-qualified status.");
  if(!GROUPS.has(groupBy))issues.push("Unsupported grouping."); if(tab!=="overview")issues.push("Invalid tab.");
  if(region&&!REGION.test(region))issues.push("Invalid region."); if(factoryId&&!UUID.test(factoryId))issues.push("Invalid factoryId."); if(cursor&&!CURSOR.test(cursor))issues.push("Invalid cursor.");
  if(issues.length)return{ok:false,issues};
  return{ok:true,value:{periodFrom,periodTo,compareFrom,compareTo,region,factoryId,method:method as AnalyticsQuery["method"],status,visitStatus,reviewStatus,groupBy:groupBy as AnalyticsQuery["groupBy"],tab:"overview",cursor}};
}
export function serializeAnalyticsQuery(q:AnalyticsQuery){const p=new URLSearchParams();for(const k of ["periodFrom","periodTo","compareFrom","compareTo","region","factoryId","method","status","visitStatus","reviewStatus","groupBy","tab","cursor"] as const){const v=q[k];if(v!==null&&v!==""&&!(k==="groupBy"&&v==="none")&&!(k==="tab"&&v==="overview"))p.set(k,v);}return p.toString();}
