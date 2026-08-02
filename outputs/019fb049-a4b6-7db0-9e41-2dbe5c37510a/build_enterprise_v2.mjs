import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const dir="/Users/vikramindla/Developer/Inspection/outputs/019fb049-a4b6-7db0-9e41-2dbe5c37510a";
const input=path.join(dir,"Inspection_Persona_Journey_Forensic_Audit_2026-07-30_ada62124.xlsx");
const output=path.join(dir,"Inspection_Enterprise_Journey_Training_Audit_2026-07-30_ada62124.xlsx");
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(input));
wb.comments.setSelf({displayName:"Vikram Indla"});

const enterpriseNames=["00_ENTERPRISE_HOME","01_GOLDEN_CANVAS","02_TRAINING_STEPS","03_DATA_WIRING","04_FIX_PROMPTS","05_RULES_DECISIONS"];
for(const n of enterpriseNames){const x=wb.worksheets.getItemOrNullObject(n);if(!x.isNullObject)x.delete();}
const C={navy:"#102A43",blue:"#1D4E89",cyan:"#D9EFF7",green:"#DDEFE5",greenDark:"#257A4B",amber:"#FFF0C2",amberDark:"#9A6700",red:"#F8D7DA",redDark:"#A61B1B",grey:"#E9EEF3",greyDark:"#52606D",white:"#FFFFFF",ink:"#102A43",purple:"#E9E1F8",teal:"#D8F0EC"};
const stageColor={WORKING:C.green,BREAKING:C.red,PARTIAL:C.amber,UNVERIFIED:C.grey,"DECISION NEEDED":C.purple};
const stageFont={WORKING:C.greenDark,BREAKING:C.redDark,PARTIAL:C.amberDark,UNVERIFIED:C.greyDark,"DECISION NEEDED":"#5B3A8A"};

function title(s,range,text,sub){
  s.showGridLines=false;s.getRange(range).merge();s.getRange(range.split(":")[0]).values=[[text]];
  s.getRange(range).format={fill:C.navy,font:{name:"Aptos Display",size:18,bold:true,color:C.white},verticalAlignment:"center"};
  const r=Number(range.match(/\d+/)[0])+1;const end=range.split(":")[1].replace(/\d+/g,"");
  s.getRange(`A${r}:${end}${r}`).merge();s.getRange(`A${r}`).values=[[sub]];
  s.getRange(`A${r}:${end}${r}`).format={fill:C.cyan,font:{name:"Aptos",size:10,italic:true,color:C.ink},verticalAlignment:"center"};
}
function border(r,color="#CBD5E1"){r.format.borders={preset:"all",style:"thin",color};}
function status(r,status){r.format={fill:stageColor[status],font:{bold:true,color:stageFont[status]},horizontalAlignment:"center",verticalAlignment:"center",wrapText:true,borders:{preset:"outside",style:"medium",color:stageFont[status]}};}
function comment(sheet,cell,text){wb.comments.addThread({cell:sheet.getRange(cell)},text);}

const blocks=[
["B01","Identity & access",3,10,"BREAKING","Admin → all personas","BP-001","Approved disposable users + identity contract"],
["B02","Admin configuration",5,11,"PARTIAL","Compliance Admin → Planner/Inspector","BP-003; BP-004","Publish package/checklist and execution configuration"],
["B03","Plan & publish visit",6,11,"PARTIAL","Planner → Inspector","BP-005; BP-006","Atomic/idempotent publish and complete target data"],
["B04","Prepare, travel & arrive",4,10,"BREAKING","Inspector → Operations","BP-009; BP-010","Safe inspector runtime and canonical arrival linkage"],
["B05","Execute & submit",6,11,"PARTIAL","Inspector → Reviewer","BP-011; BP-012; BP-014","Prove field types, evidence, draft/resume and immutable submission"],
["B06","Review & rework",4,9,"BREAKING","Reviewer ↔ Inspector","BP-014","Enforce review-before-approval and version integrity"],
["B07","Corrective action & closure",2,10,"BREAKING","Compliance → Owner → Reviewer","BP-016","Define owner identity, portal, evidence and closure"],
["B08","Reporting, notifications & external sync",4,12,"BREAKING","System → Management / Senaei","BP-019; BP-021; BP-022","Publish KPI config; complete notices and provider trigger"]
];

const steps=[
["01","Admin","Create persona","/admin/access","Staff identity; tenant/org; role; capability grants","C","profiles; user_roles; user_capability_grants","Identity tables + Supabase Auth","BREAKING","BP-001","Provide safe persona pack","Admin/Identity"],
["02","Compliance Admin","Create configuration request","/admin/compliance-requests/new","Regulation; package; checklist items; workflow; effective version","C/U","compliance_configuration_requests; components; package_versions","Server actions → RLS tables","PARTIAL","BP-003","Run maker-checker fixture","Compliance"],
["03","Approver","Approve and publish configuration","/admin/compliance-approvals","Decision; reason; effective date/version","C/U","decisions; publications; immutable versions","Approval transition/RPC","UNVERIFIED","BP-003","Prove self-approval deny + publish","Compliance"],
["04","Admin","Publish execution rules","/admin/execution","Capacity; modes; cancellation reasons; eligibility settings","U","engine_settings; config_versions","Admin action → versioned config","PARTIAL","BP-004","Confirm governed values","Product/Operations"],
["05","Planner","Select canonical factory","/planning/single","CR/licence/factory; official location; legal/status data","R","factories; industrial_licenses; commercial_registrations; plant_addresses","RLS reads + target resolver","BREAKING","BP-005","Backfill canonical master data","Data/Integration"],
["06","Planner","Define visit","/planning/single","Visit type; priority; window; mode; optional package","C/U","visit_plans; planning_lookups; visit_packages","Draft service + validation","PARTIAL","BP-006","Preflight and draft recovery","Planning"],
["07","Planner","Assign inspector","/planning/single","Inspector; capacity; overlap; region/org scope","C","assignments","Eligibility resolver","UNVERIFIED","BP-001; BP-006","Use clean eligible inspectors","Planning/Identity"],
["08","Planner","Publish exactly once","/planning/single","Validated intent + idempotency key","C/U","visit_plans; visits; assignments; package snapshots; audit; notifications","publish_single_visit transaction","BREAKING","BP-006","Make all writes atomic","Backend/DB"],
["09","Inspector","Sign in and find assignment","/login → /execution or /field","Work identity; assigned published visit","R","auth session; profiles; assignments; visits","Auth + RLS read","BREAKING","BP-001; BP-009","Approved inspector credential","Identity/QA"],
["10","Inspector","Prepare visit","/field/[visitId]","Execution date; eligible mode; package resolution; readiness","C/U","visit_preparations; visit_packages; visits","Preparation transition","UNVERIFIED","BP-009","Prove missing-package/config branches","Execution"],
["11","Inspector","Start journey","/field/[visitId]/travel","Current time; location permission; visit window","C/U","journey_sessions; lifecycle events; visits","Journey transition","UNVERIFIED","BP-010","Define configured/unconfigured behavior","Execution/GIS"],
["12","Inspector","Confirm arrival","/field/[visitId]/travel","Coordinates; geofence result or override; arrival evidence","C","geo_events; evidence; visit_location_events","Arrival transition + evidence upload","BREAKING","BP-010","Repair arrival linked_id semantics","GIS/DB"],
["13","Inspector","Start inspection","/field/inspection/[id]","Eligibility; start timestamp","C/U","inspections","Execution transition","UNVERIFIED","BP-011","Prove transition guards","Execution"],
["14","Inspector","Answer checklist","/field/inspection/[id]","Text; number; select; date; mandatory and conditional answers","C/U","checklist_responses","Client/server validation","PARTIAL","BP-011","Test every configured field type","Frontend/Backend"],
["15","Inspector","Attach evidence and finding","/field/inspection/[id]","Photo/document; note; classification; violation code","C","evidence; storage; findings; violations","Upload + mutations","PARTIAL","BP-012","Test retry, failure, linkage, file limits","Storage/Execution"],
["16","Inspector","Save, leave and resume","/field/inspection/[id]","Draft answers/evidence; local/server version","R/U","responses; evidence; local sync/conflicts","Draft service + conflict resolver","UNVERIFIED","BP-012","Prove refresh/re-login/conflict paths","Offline/Execution"],
["17","Inspector","Submit immutable version","/field/inspection/[id]","Completion attestation; all mandatory checkpoints","C/U","submission_versions; inspections; audit; notifications","Submission transaction","BREAKING","BP-014","Enforce immutable snapshot before submitted","Workflow/DB"],
["18","Reviewer","Open review","/reviews/[id]","Latest submission version; evidence; factory context","R/C","reviews; submission_versions","RLS + review claim","UNVERIFIED","BP-001; BP-014","Provide reviewer fixture","Review"],
["19","Reviewer","Approve / reject / return","/reviews/[id]","Decision; reason; returned sections","C/U","reviews; inspections; audit; notifications","Review transition","BREAKING","BP-014","DB-enforce review-before-approval","Review/DB"],
["20","Inspector","Correct returned scope","/field/inspection/[id]","Only returned answers/evidence","U/C","responses; evidence; submission_versions","Scoped rework + new version","UNVERIFIED","BP-014","Prove tamper-evident scope rail","Execution/Review"],
["21","Compliance","Open follow-up case","/cases","Case type; origin inspection; owner","C","cases","Case server action","PARTIAL","BP-016","Define assignment and duplicate prevention","Cases"],
["22","Corrective owner","Submit corrective evidence","Not found","Owner identity; remediation evidence; response","C/U","correction evidence / case records","No complete route confirmed","BREAKING","BP-016","Create owner portal journey","Product/Engineering"],
["23","System","Notify every handoff","Background","Recipient; channel; preference; payload; idempotency","C/U","notifications; notification_preferences","Outbox/provider worker","BREAKING","BP-021","Complete preferences + delivery receipts","Integration"],
["24","System / Management","Report, close and sync","/dashboard + background","Published KPI config; terminal rules; Senaei trigger/receipt","R/C/U","dashboard_config_*; facts; integration attempts","KPI engine + Senaei adapter","BREAKING","BP-019; BP-022","Decide closure + trigger; publish config","Product/Data/Integration"]
];

const wiring=[
["Identity","Login → effective capability","login form","Supabase Auth","profiles → user_roles → role_capabilities/user grants","R","Directory contract absent; credential path blocked","P0","BP-001"],
["Compliance config","Request → approved immutable versions","admin request wizard","Server actions / approval transition","requests → components → versions → publications","C/U","Runtime maker-checker proof missing","P0","BP-003"],
["Execution config","Admin settings → validation consumers","admin execution","Versioned config action","engine_settings/config_versions","R/U","Active governed values cannot be confirmed","P0","BP-004"],
["Factory target","Planner selection → canonical target","planning single","Target resolver","factories + CR + licence + plant","R","Identity/status/location sparsity","P0","BP-005"],
["Publish","Planner confirm → executable visit","planning single","publish_single_visit","plan + visit + assignment + snapshots + audit + notification","C/U","Transaction not proven atomic/idempotent","P0","BP-006"],
["Preparation","Assigned visit → ready","field visit","Preparation transition","visit_preparations + visit_packages + visits","C/U","Runtime and missing-config branches unverified","P0","BP-009"],
["Arrival","Travel → arrival proof","travel UI","Arrival transition/upload","journey_sessions + geo_events + evidence","C/U","12/32 arrival evidence links ambiguous","P1","BP-010"],
["Checklist","Inputs → persisted responses","inspection UI","Draft/validation services","checklist_responses + evidence + findings + violations","C/U","Every field/attachment/conflict branch unverified","P1","BP-011; BP-012"],
["Submission","Submit → immutable version","inspection UI","Submission transition","submission_versions + inspections + audit + notifications","C/U","Approved record exists without version","P0","BP-014"],
["Review","Decision → inspection state","review workspace","Review transition","reviews + inspections + audit + notifications","C/U","Approved record exists without review","P0","BP-014"],
["Corrective action","Case → owner response → closure","cases / missing owner UI","Incomplete","cases + correction evidence","C/U","Owner route/identity/closure missing","P1","BP-016"],
["Dashboard","Facts → governed KPI","dashboard","KPI engine","dashboard_config_* + fact tables","R","Config heads/versions/parameters empty","P1","BP-019"],
["Notification","Event → recipient receipt","background","Outbox/provider","notifications + preferences","C/U","7/8 profiles lack preferences; delivery unverified","P1","BP-021"],
["Senaei","Submission → external receipt","background adapter","Senaei multipart adapter","integration attempt + provider receipt","C/U","BLOCKED_TRIGGER_DECISION","P1","BP-022"]
];

const fixes=[
["FIX-001","BP-001","P0","Identity + safe fixtures","Create an approved non-production persona and fixture pack","Implement a reset-safe fixture module that provisions distinct Admin, Planner, Inspector, Reviewer, Compliance, Operations and Leadership users with non-role display names, tenant/org scope, effective roles/capabilities, explicit notification preferences and scenario-owned records. Do not print credentials. Add positive login, wrong-role denial, cross-scope RLS denial and cleanup/provenance evidence. Do not modify shared staging records outside the fixture batch.","Persona tours authenticate; unauthorized paths fail; fixture data is tagged, reset-safe and isolated.","Vikram: approve disposable environment and credential custody model.","Identity + QA"],
["FIX-002","BP-003","P0","Compliance maker-checker","Prove configuration creation, return, revision and publication","Using a safe fixture, execute the compliance configuration request journey from draft through maker-checker approval and immutable publication. Trace regulation, package, item, dependency, decision and publication rows. Add self-approval denial, missing-dependency rejection, returned-revision and duplicate publish tests. Preserve every governed value; do not invent policy.","One immutable published package/checklist version is visible to Planning and Execution with complete audit evidence.","Vikram: confirm maker and checker role separation.","Compliance"],
["FIX-003","BP-004","P0","Execution configuration","Publish only approved execution configuration","Reconcile execution settings consumers with engine_settings/config_versions. Render Not configured for missing policy. Add versioned publish flow and server-side validation for modes, capacity and reasons. Do not add distances, thresholds, SLAs or reasons without approved decision records.","Active configuration version is auditable and consumed consistently by UI, actions, RPCs and RLS.","Vikram: approve policy owner and source for each governed setting.","Product + Operations"],
["FIX-004","BP-005","P0","Canonical factory data","Repair planning target identity and location","Build a provenance-preserving reconciliation that joins factories to industrial licences, commercial registrations and plant addresses; backfill only source-supported fields; quarantine ambiguity; hard-gate visits lacking required identity/status/confirmed coordinates; show actionable missing-data states.","Planner cannot publish an operational visit against an incomplete or ambiguous target; every displayed value carries source provenance.","Vikram: approve authoritative-source precedence when providers disagree.","Data + Integration"],
["FIX-005","BP-006","P0","Atomic visit publication","Make single-visit publish atomic and idempotent","Refactor publish_single_visit so one transaction revalidates capability, target, licence, window, package versions, inspector eligibility, overlap, capacity and idempotency, then writes plan, visit, assignment, all package snapshots, provenance, audit and notification intent. Add fault injection after each write and concurrent duplicate requests.","Any forced failure leaves no executable partial record; retry returns the original receipt and creates no duplicate.","Vikram: confirm whether zero package selection remains valid at publish.","Backend + DB"],
["FIX-006","BP-010","P1","Arrival evidence integrity","Make every arrival proof resolve to one canonical event","Define the allowed linked_type/linked_id semantics for arrival evidence. Add FK/constraint or guarded transition, migrate or quarantine unresolved records, and test normal arrival, configured geofence failure, unconfigured geofence, override approval and duplicate arrival.","All arrival evidence resolves to the visit and one canonical geo/journey event; invalid linkage is rejected.","Vikram: approve unconfigured-geofence behavior; recommendation: explicit Not configured + controlled override, never an invented distance.","GIS + DB"],
["FIX-007","BP-014","P0","Submission/review integrity","Enforce immutable version and review before approval","Create canonical transition functions and database guards so submit atomically creates an immutable submission_version and approval requires an authorized review against the latest version. Deny direct status mutation and self-approval. Quarantine or repair the existing approved record lacking both version and review.","No approval without immutable version and review; submitted versions cannot be edited; all decisions are audited.","Vikram: approve remediation treatment for the existing invalid record—recommended quarantine with audit, not silent backfill.","Workflow + DB"],
["FIX-008","BP-016","P1","Corrective action owner","Implement the missing owner-to-closure journey","Define owner identity and assignment source, scoped portal/task list, obligation details, evidence upload, save/resume, submit, reviewer return/accept, deadline/late state only if governed, notifications and immutable closure receipt. Add owner-only and cross-factory denial tests.","A named owner can close an obligation through evidence-backed review without off-platform handoffs.","Vikram: choose internal user, factory representative, or both as supported owner types; recommendation: model both explicitly, never overload one role.","Product + Engineering"],
["FIX-009","BP-019","P1","Dashboard governance","Publish versioned KPI configuration","Create the governed dashboard configuration workflow for heads, versions and parameters. Bind every KPI to source facts, population, exclusions, dates and owner. Missing rules must render Unavailable. Add reconciliation from displayed KPI to source records.","Every KPI is versioned, source-backed and reproducible; no empty config produces a numeric claim.","Vikram: name the KPI policy owner; recommendation: Compliance owns definitions, Data owns implementation, Leadership approves publication.","Product + Data"],
["FIX-010","BP-021","P1","Notification reliability","Complete preferences, outbox and receipts","Provision explicit notification preferences for every fixture persona. For each material lifecycle event, create idempotent notification intent, resolve correct recipient, apply preference/suppression, deliver through deterministic test sink, record attempt/receipt/failure and retry safely.","Assignment, return, approval and corrective-action notifications reach only intended actors with auditable receipts.","Vikram: approve mandatory channels that cannot be suppressed; recommendation: keep regulatory workflow notices mandatory in-app and treat external channels as additive until policy is approved.","Integration"],
["FIX-011","BP-022","P1","Senaei integration","Resolve governed trigger and implement delivery lifecycle","Approve the exact lifecycle event that authorizes Senaei submission. Implement idempotent multipart delivery, credential isolation, retry classification, provider receipt, reconciliation and operator-visible failure. Preserve BLOCKED_TRIGGER_DECISION until approval; do not infer provider SLA.","One authorized event sends once, failures are recoverable, and the provider receipt is linked to the immutable submission.","Vikram: choose trigger. Recommendation: after governed final approval/closure, not raw inspector submission.","Product + Integration"]
];

const decisions=[
["DEC-AUD-001","Role separation","Are Planning Supervisor, operational Supervisor and formal Approver one, two or three roles?","Recommend three explicit capabilities/roles, assignable to the same person only through governed policy; enforce segregation where maker-checker applies.","Prevents label ambiguity and self-approval while allowing small-team staffing.","BLOCKING","Vikram / Product Owner","Approve capability matrix and allowed combinations."],
["DEC-AUD-002","Inspector surface","Is desktop/web inspector execution supported, or field/PWA only?","Recommend field/PWA as the execution surface and desktop/web as read-only supervision unless a desktop execution requirement is explicitly approved.","Avoids certifying a channel that has no clear route contract.","BLOCKING","Vikram / Product Owner","Confirm supported channel and redirect/landing behavior."],
["DEC-AUD-003","Zero-package publish","May Planning publish a visit with no package?","Retain documented rule: yes, but mark Preparation required and block execution until an eligible immutable package is resolved.","Preserves planner flexibility without an executable empty inspection.","BLOCKING","Vikram / Product Owner","Confirm rule and visible status wording."],
["DEC-AUD-004","Geofence unconfigured","What happens when no governed geofence value exists?","Show Not configured; block automatic geofence assertion; allow only an audited override if the actor has explicit capability. Never invent a distance.","Complies with no-invented-policy rule and preserves auditability.","BLOCKING","Vikram / Operations Policy Owner","Approve block-versus-override behavior and owner."],
["DEC-AUD-005","Invalid approved record","How should the approved inspection without version/review be handled?","Quarantine it from reporting and downstream enforcement with an audit note; do not synthesize historical versions or reviews.","Avoids fabricating legal evidence.","BLOCKING","Vikram / Compliance Owner","Approve quarantine/repair protocol."],
["DEC-AUD-006","Corrective owner","Who can own corrective action?","Support explicit internal owner and factory representative actor types with separate permissions and identity proof; do not overload Compliance Officer.","Makes accountability and RLS testable.","BLOCKING","Vikram / Product Owner","Approve actor types and assignment authority."],
["DEC-AUD-007","Legal closure","What makes a visit legally and operationally complete?","Recommend a versioned closure invariant: approved immutable submission + required corrective obligations closed/waived by authorized decision + report generated + mandatory notifications queued + required external receipt or explicit provider-unavailable exception.","Creates one auditable terminal rule without inventing deadlines or penalties.","BLOCKING","Vikram / Compliance + Legal","Approve mandatory components and exception authority."],
["DEC-AUD-008","Senaei trigger","When may the external submission be sent?","Recommend after final governed approval/closure, using the immutable approved version and idempotency key.","Prevents externalizing unreviewed inspector drafts.","BLOCKING","Vikram / Integration Governance","Approve trigger and exception handling."],
["DEC-AUD-009","KPI ownership","Who owns dashboard definitions and publication?","Recommend Compliance owns business definition, Data Engineering implements, Leadership/authorized committee approves publication.","Separates policy from implementation and consumption.","NON-BLOCKING TO VISIT","Vikram / Leadership","Approve RACI and publication role."],
["DEC-AUD-010","Notification mandate","Which lifecycle notices can users suppress?","Recommend assignment, return, approval/rejection and corrective obligation remain mandatory in-app; external channels remain configurable until policy states otherwise.","Protects workflow visibility without inventing SMS/email mandates.","BLOCKING","Vikram / Operations + Legal","Approve mandatory events and channels."]
];

// Create detailed sheets first; HOME is last so it becomes the active visual landing in most viewers.
const rules=wb.worksheets.add("05_RULES_DECISIONS");title(rules,"A1:H1","RULES DECISION CENTER","Only decisions requiring Product Owner / policy authority. Recommendations do not invent governed values.");
rules.getRange("A4:H4").values=[["Decision","Rule area","Question for Vikram","Recommended answer","Why","Impact","Decision owner","Action"]];
rules.getRange("A5:H14").values=decisions;border(rules.getRange("A4:H14"));rules.getRange("A4:H4").format={fill:C.blue,font:{bold:true,color:C.white}};
rules.getRange("A5:H14").format={wrapText:true,verticalAlignment:"top"};rules.getRange("A5:H14").format.rowHeight=76;
[15,20,34,58,35,18,24,32].forEach((w,i)=>rules.getRangeByIndexes(0,i,15,1).format.columnWidth=w);
rules.freezePanes.freezeRows(4);rules.getRange("F5:F14").conditionalFormats.add("containsText",{text:"BLOCKING",format:{fill:C.red,font:{bold:true,color:C.redDark}}});

const fix=wb.worksheets.add("04_FIX_PROMPTS");title(fix,"A1:J1","FIX PROMPT CENTER","Copy-ready implementation prompts. Each prompt is bounded by the verified breakpoint and includes acceptance evidence.");
fix.getRange("A4:J4").values=[["Fix","Finding","Severity","Workstream","Outcome","Copy-ready execution prompt","Acceptance criteria","Assistance needed from Vikram","Owner type","Status"]];
fix.getRange("A5:J15").values=fixes.map(x=>[...x,"READY AFTER DECISION"]);border(fix.getRange("A4:J15"));fix.getRange("A4:J4").format={fill:C.blue,font:{bold:true,color:C.white}};
fix.getRange("A5:J15").format={wrapText:true,verticalAlignment:"top"};fix.getRange("A5:J15").format.rowHeight=120;
[12,13,10,24,32,100,60,48,22,20].forEach((w,i)=>fix.getRangeByIndexes(0,i,16,1).format.columnWidth=w);
fix.freezePanes.freezeRows(4);fix.getRange("C5:C15").conditionalFormats.add("containsText",{text:"P0",format:{fill:C.red,font:{bold:true,color:C.redDark}}});
fix.getRange("J5:J15").dataValidation={rule:{type:"list",values:["READY AFTER DECISION","APPROVED","IN PROGRESS","VERIFIED","DEFERRED"]}};

const wire=wb.worksheets.add("03_DATA_WIRING");title(wire,"A1:I1","DATA + WIRING CONTROL MAP","From UI action to service, database truth and current break. R=Read · C=Create · U=Update · D=Delete.");
wire.getRange("A4:I4").values=[["Domain","Wiring path","UI surface","Service / RPC","Database truth","CRUD","Current wiring issue","Severity","Finding"]];
wire.getRange("A5:I18").values=wiring;border(wire.getRange("A4:I18"));wire.getRange("A4:I4").format={fill:C.blue,font:{bold:true,color:C.white}};
wire.getRange("A5:I18").format={wrapText:true,verticalAlignment:"top"};wire.getRange("A5:I18").format.rowHeight=64;
[20,35,28,32,48,12,60,12,20].forEach((w,i)=>wire.getRangeByIndexes(0,i,19,1).format.columnWidth=w);
wire.freezePanes.freezeRows(4);wire.getRange("H5:H18").conditionalFormats.add("containsText",{text:"P0",format:{fill:C.red,font:{bold:true,color:C.redDark}}});

const train=wb.worksheets.add("02_TRAINING_STEPS");title(train,"A1:L1","TRAINING RUNBOOK — ONE VISIT END TO END","What the learner fills, what the platform reads/writes, what should happen, and the exact break/fix owner.");
train.getRange("A4:L4").values=[["Step","Persona","Learner action","Screen / route","Fields to fill or verify","CRUD","Records affected","Wiring","State","Finding","Trainer instruction / recovery","Fix owner"]];
train.getRange("A5:L28").values=steps;border(train.getRange("A4:L28"));train.getRange("A4:L4").format={fill:C.blue,font:{bold:true,color:C.white}};
train.getRange("A5:L28").format={wrapText:true,verticalAlignment:"top"};train.getRange("A5:L28").format.rowHeight=72;
[8,18,30,30,52,10,48,42,16,20,48,22].forEach((w,i)=>train.getRangeByIndexes(0,i,29,1).format.columnWidth=w);
train.freezePanes.freezeRows(4);train.freezePanes.freezeColumns(2);
for(const st of Object.keys(stageColor))train.getRange("I5:I28").conditionalFormats.add("containsText",{text:st,format:{fill:stageColor[st],font:{bold:true,color:stageFont[st]}}});

const canvas=wb.worksheets.add("01_GOLDEN_CANVAS");title(canvas,"A1:I1","GOLDEN THREAD — ENTERPRISE TRAINING CANVAS","Hover/comment on each stage for fields, CRUD, wiring, break and fix. Percentages are evidence-backed verified checkpoints ÷ applicable checkpoints.");
canvas.getRange("A4:I4").values=[["Lane / stage","1 · Identity","2 · Configure","3 · Plan","4 · Prepare + arrive","5 · Execute + submit","6 · Review + rework","7 · Correct + close","8 · Report + sync"]];
canvas.getRange("A5:A11").values=[["Administrator"],["Planner"],["Inspector"],["Reviewer"],["Corrective owner"],["System"],["Management"]];
canvas.getRange("B5:I11").values=[
[["Create users\n30%"].join("") ,"Publish package + rules\n45%","","","","","",""],
["","", "Select target → assign → publish\n55%","","","","",""],
["","","","Login → prepare → arrive\n40%","Checklist → evidence → submit\n55%","","",""],
["","","","","","Review → decide → rework\n44%","",""],
["","","","","","","Respond → close\n20%",""],
["Identity/RLS guard","Audit/config versions","Atomic publish + notify","Geo/lifecycle events","Immutable version + notify","Review audit + notify","Closure invariant","KPI + notification + Senaei\n33%"],
["","","","","","","","Dashboard / report\n33%"]
];
border(canvas.getRange("A4:I11"));canvas.getRange("A4:I4").format={fill:C.blue,font:{bold:true,color:C.white},wrapText:true,horizontalAlignment:"center"};
canvas.getRange("A5:A11").format={fill:C.navy,font:{bold:true,color:C.white},verticalAlignment:"center"};
canvas.getRange("B5:I11").format={wrapText:true,horizontalAlignment:"center",verticalAlignment:"center",font:{bold:true,size:11}};
canvas.getRange("A4:I11").format.rowHeight=72;canvas.getRange("A:A").format.columnWidth=22;canvas.getRange("B:I").format.columnWidth=25;
for(const cell of ["B5","C5","D6","E7","F7","G8","H9","I10","I11"])status(canvas.getRange(cell),["B5","E7","G8","H9","I10","I11"].includes(cell)?"BREAKING":"PARTIAL");
for(const cell of ["B10","C10","D10","E10","F10","G10","H10"])status(canvas.getRange(cell),"UNVERIFIED");
comment(canvas,"B5","FIELDS: staff identity, tenant/org scope, roles, capability grants.\nCRUD: Create profiles/user_roles/grants; Read effective access.\nBREAK: National ID directory contract absent; inspector login failed.\nFIX: FIX-001.\nASSISTANCE: approve disposable environment and credential custody.");
comment(canvas,"C5","FIELDS: regulations, package/checklist versions, workflow, effective version; execution modes/capacity/reasons only from approved policy.\nCRUD: Create/Update requests and config versions; publish immutable versions.\nBREAK: maker-checker and active values not runtime-proven.\nFIX: FIX-002, FIX-003.");
comment(canvas,"D6","FIELDS: canonical factory/CR/licence/location, window, type, mode, package, inspector.\nCRUD: Read target/config; Create plan/visit/assignment/snapshots/audit/notification.\nBREAK: sparse target data; atomicity/idempotency unproven.\nFIX: FIX-004, FIX-005.");
comment(canvas,"E7","FIELDS: work identity, execution date, package resolution, location and override evidence.\nCRUD: Read assignment; Create/Update preparation, journey, geo and lifecycle records.\nBREAK: runtime auth; 12/32 ambiguous arrival links.\nFIX: FIX-001, FIX-006.");
comment(canvas,"F7","FIELDS: all configured response types, mandatory/conditional answers, evidence, findings, attestation.\nCRUD: Create/Update responses/evidence/findings/violations; Create immutable submission_version.\nBREAK: end-to-end and failure/recovery paths unverified; invalid approved record proves guard gap.\nFIX: FIX-007.");
comment(canvas,"G8","FIELDS: latest immutable version, decision, reason, returned scope.\nCRUD: Read submission/evidence; Create review; Update inspection only through guarded transition.\nBREAK: approved inspection exists without version or review.\nFIX: FIX-007.");
comment(canvas,"H9","FIELDS: owner identity, obligation, corrective evidence, response.\nCRUD: Create/Update case response and evidence; closure receipt.\nBREAK: dedicated owner route and closure invariant not found.\nFIX: FIX-008.\nASSISTANCE: decide supported owner actor types.");
comment(canvas,"I10","CRUD: Create notification intents/receipts and integration attempts; Read KPI facts/config.\nBREAK: preferences missing for 7/8 profiles; dashboard config empty; Senaei trigger blocked.\nFIX: FIX-009, FIX-010, FIX-011.");
canvas.getRange("A13:I13").merge();canvas.getRange("A13").values=[["RED = blocks training completion · AMBER = partially wired · GREY = static/unverified · Hover/comment markers contain field + CRUD + fix detail"]];
canvas.getRange("A13:I13").format={fill:C.grey,font:{italic:true,color:C.greyDark},horizontalAlignment:"center"};
canvas.freezePanes.freezeRows(4);canvas.freezePanes.freezeColumns(1);

const home=wb.worksheets.add("00_ENTERPRISE_HOME");title(home,"A1:L1","INSPECTION JOURNEY COMMAND CENTER","Training-first view: follow the golden thread, see block completion, open fix prompts, and answer only the rules that need Product Owner authority.");
home.getRange("A4:C4").merge();home.getRange("A4").values=[["INSPECTOR END-TO-END VERDICT"]];
home.getRange("A5:C7").merge();home.getRange("A5").values=[["NO — core journey cannot yet be trained or certified end to end"]];
home.getRange("A4:C4").format={fill:C.redDark,font:{bold:true,color:C.white},horizontalAlignment:"center"};
home.getRange("A5:C7").format={fill:C.red,font:{bold:true,color:C.redDark,size:16},wrapText:true,horizontalAlignment:"center",verticalAlignment:"center",borders:{preset:"outside",style:"medium",color:C.redDark}};
home.getRange("E4:L4").values=[blocks.map(x=>x[1])];home.getRange("E5:L5").values=[blocks.map(x=>x[2])];home.getRange("E6:L6").values=[blocks.map(x=>x[3])];
home.getRange("E7:L7").formulas=[blocks.map((x,i)=>`=IF(E6=0,0,E5/E6)`.replaceAll("E",String.fromCharCode(69+i)))];
home.getRange("E4:L4").format={fill:C.blue,font:{bold:true,color:C.white},wrapText:true,horizontalAlignment:"center"};
home.getRange("E5:L7").format={horizontalAlignment:"center",font:{bold:true,size:12},borders:{preset:"all",style:"thin",color:"#CBD5E1"}};
home.getRange("E7:L7").format.numberFormat="0%";home.getRange("E7:L7").conditionalFormats.add("colorScale",{colors:[C.red,C.amber,C.green],thresholds:["min","50%","max"]});
home.getRange("A10:L10").merge();home.getRange("A10").values=[["ENTERPRISE NAVIGATION"]];
home.getRange("A10:L10").format={fill:C.navy,font:{bold:true,color:C.white},horizontalAlignment:"center"};
const nav=[["1. GOLDEN CANVAS","Swimlanes + hover detail","='01_GOLDEN_CANVAS'!A1"],["2. TRAINING STEPS","Fields, CRUD, state and recovery","='02_TRAINING_STEPS'!A1"],["3. DATA WIRING","UI → service → database → break","='03_DATA_WIRING'!A1"],["4. FIX PROMPTS","Copy-ready remediation prompts","='04_FIX_PROMPTS'!A1"],["5. RULES DECISIONS","Your decisions + recommended answers","='05_RULES_DECISIONS'!A1"],["6. FORENSIC APPENDIX","Original evidence and trace tables","='11_BREAKPOINT_REGISTER'!A1"]];
home.getRange("A12:C17").values=nav;home.getRange("A12:A17").format={fill:C.blue,font:{bold:true,color:C.white}};home.getRange("B12:C17").format={fill:C.cyan,wrapText:true};border(home.getRange("A12:C17"));
home.getRange("E10:L10").merge();home.getRange("E10").values=[["WHAT NEEDS VIKRAM'S ASSISTANCE NOW"]];
home.getRange("E10:L10").format={fill:C.purple,font:{bold:true,color:"#5B3A8A"},horizontalAlignment:"center"};
home.getRange("E12:L17").merge(true);home.getRange("E12:E17").values=[
["1 · Approve disposable persona environment and credential custody"],
["2 · Confirm role separation and supported inspector execution surface"],
["3 · Approve zero-package and unconfigured-geofence behaviors"],
["4 · Approve quarantine treatment for invalid approved inspection"],
["5 · Define corrective owner types and legal closure invariant"],
["6 · Approve Senaei trigger, KPI RACI and mandatory notification events"]
];
home.getRange("E12:L17").format={fill:C.amber,font:{bold:true,color:C.amberDark},wrapText:true,borders:{preset:"all",style:"thin",color:C.amberDark}};
home.getRange("A20:L20").merge();home.getRange("A20").values=[["Completion is checkpoint-based, not opinion: verified mandatory checkpoints ÷ applicable checkpoints. Hover/comment markers appear on the Golden Canvas."]];
home.getRange("A20:L20").format={fill:C.grey,font:{italic:true,color:C.greyDark},horizontalAlignment:"center"};
home.getRange("A1:L20").format.rowHeight=34;home.getRange("A:C").format.columnWidth=25;home.getRange("D:D").format.columnWidth=3;home.getRange("E:L").format.columnWidth=18;
home.getRange("A5:C7").format.rowHeight=38;home.freezePanes.freezeRows(2);

const chartData=home.getRange("N3:O11");chartData.values=[["Block","Completion"],...blocks.map(x=>[x[1],x[2]/x[3]])];home.getRange("O4:O11").format.numberFormat="0%";
const ch=home.charts.add("bar",chartData);ch.title="Evidence-backed completion by block";ch.hasLegend=false;ch.xAxis={axisType:"textAxis",textStyle:{fontSize:9}};ch.yAxis={numberFormatCode:"0%",min:0,max:1};ch.setPosition("A22","L42");

for(const s of [home,canvas,train,wire,fix,rules]){s.getUsedRange().format.font={name:"Aptos",size:10};}
home.getRange("A1:L1").format.font={name:"Aptos Display",size:18,bold:true,color:C.white};

const checks=await wb.inspect({kind:"table",range:"00_ENTERPRISE_HOME!A1:L20",include:"values,formulas",tableMaxRows:25,tableMaxCols:14,maxChars:7000});console.log(checks.ndjson);
const err=await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",options:{useRegex:true,maxResults:200},summary:"enterprise v2 formula error scan"});console.log(err.ndjson);
for(const n of enterpriseNames){
  const p=await wb.render({sheetName:n,autoCrop:"all",scale:0.85,format:"png"});
  await fs.writeFile(path.join(dir,`preview-v2-${n}.png`),new Uint8Array(await p.arrayBuffer()));
}
const out=await SpreadsheetFile.exportXlsx(wb);await out.save(output);console.log(output);
