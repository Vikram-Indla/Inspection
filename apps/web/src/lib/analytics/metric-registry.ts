import { analyticsMessages } from "@/features/analytics/strings";
import { fill } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";

type MetricUnit = "factories" | "inspectors" | "hours";

const count=(v:number,locale:Locale)=>formatCount(v,locale);
const percent=(v:number,locale:Locale)=>formatPercent(v,locale,1);
const withUnit=(unit:MetricUnit,fractionDigits=0)=>(v:number,locale:Locale)=>
  fill(analyticsMessages(locale).units[unit],{count:formatCount(v,locale,fractionDigits)});
export const ANALYTICS_METRICS=[
{key:"approved_inspection_compliance",title:"Approved-inspection compliance",definition:"Compliant eligible answers ÷ compliant plus non-compliant; zero denominator is N/A.",trace:"AN-AC-004",format:percent},
{key:"latest_l2_decision_mix",title:"Latest L2 decisions",definition:"Latest decided outcome per inspection.",trace:"AN-AC-005",format:count},
{key:"cancellation_rate",title:"Cancellation rate",definition:"Cancelled visits ÷ visits in the selected planning period.",trace:"AN-AC-006",format:percent},
{key:"active_executions",title:"Active executions",definition:"On the way, arrived, or executing.",trace:"AN-AC-007",format:count},
{key:"scheduled_load_count",title:"Scheduled load count",definition:"Visible assignments; never utilization.",trace:"AN-AC-008",format:count},
{key:"gps_override_count",title:"GPS override count",definition:"Visible governed override events.",trace:"AN-AC-009",format:count},
{key:"compliance_result_distribution",title:"Compliance-result distribution",definition:"Eligible compliant and non-compliant responses.",trace:"AN-AC-010",format:count},
{key:"factory_approved_outcome_recency",title:"Factory approved-outcome recency",definition:"Factory count plus exact latest approved timestamp; no overdue band.",trace:"AN-AC-010",format:withUnit("factories")},
{key:"visit_volume",title:"Visit volume",definition:"Visits whose planning window opens inside the selected period and scope.",trace:"AN-AC-011",format:count},
{key:"published_visit_count",title:"Published visits",definition:"Visits at planning status published, against all visits in the period.",trace:"AN-AC-012",format:count},
{key:"draft_backlog_count",title:"Draft backlog",definition:"Visits still at planning status draft, against all visits in the period.",trace:"AN-AC-013",format:count},
{key:"expired_visit_rate",title:"Expired-visit rate",definition:"Visits at planning status expired ÷ visits in the period; zero denominator is N/A.",trace:"AN-AC-014",format:percent},
{key:"immediate_visit_share",title:"Immediate-visit share",definition:"Visits planned by the immediate method, or with no plan, ÷ visits in the period.",trace:"AN-AC-015",format:percent},
{key:"factory_coverage",title:"Factory coverage",definition:"Distinct factories carrying at least one visit in the period and scope.",trace:"AN-AC-016",format:withUnit("factories")},
{key:"inspector_coverage",title:"Inspector coverage",definition:"Distinct inspectors holding a visible assignment; never utilization.",trace:"AN-AC-017",format:withUnit("inspectors")},
{key:"high_risk_factory_share",title:"High-risk factory share",definition:"Visited factories on a high or critical risk band ÷ visited factories carrying any band. Unbanded factories are excluded, never assumed low.",trace:"AN-AC-018",format:percent},
{key:"submission_throughput",title:"Submission throughput",definition:"Submission versions recorded against inspections of visits in the period.",trace:"AN-AC-019",format:count},
{key:"violation_issue_count",title:"Violations issued",definition:"Violations still in force; invalidated ones are shown separately, never netted off.",trace:"AN-AC-020",format:count},
{key:"penalty_issue_count",title:"Penalties issued",definition:"Inspection penalties at status issued. No amount is inferred.",trace:"AN-AC-021",format:count},
{key:"evidence_capture_count",title:"Evidence captured",definition:"Undeleted evidence items linked to a visit or its inspection.",trace:"AN-AC-022",format:count},
{key:"geofence_arrival_compliance",title:"Geofence arrival compliance",definition:"Arrival and check-in events resolved inside ÷ inside plus outside. Uncertain results are excluded from both sides.",trace:"AN-AC-023",format:percent},
{key:"review_return_rate",title:"Review return rate",definition:"Latest decisions that returned ÷ all latest decided reviews.",trace:"AN-AC-024",format:percent},
{key:"review_rejection_rate",title:"Review rejection rate",definition:"Latest decisions that rejected ÷ all latest decided reviews.",trace:"AN-AC-025",format:percent},
{key:"review_turnaround_hours",title:"Review turnaround",definition:"Mean hours from inspection submission to the latest review decision. Reviews missing either timestamp are excluded.",trace:"AN-AC-026",format:withUnit("hours",1)},
{key:"notification_delivery_rate",title:"Notification delivery rate",definition:"Delivered or read ÷ attempted notifications in the period. Notifications with no configured channel are excluded from both sides.",trace:"AN-AC-027",format:percent},
{key:"ai_suggestion_adoption_rate",title:"AI suggestion adoption",definition:"Adopted suggestions ÷ suggestions that have been dispositioned. Suggestions still awaiting a decision are excluded.",trace:"AN-AC-028",format:percent},
] as const;

const RATE_KEYS = new Set<string>(
  ANALYTICS_METRICS.filter(metric => metric.format === percent).map(metric => metric.key),
);

/**
 * Whether a metric is a proportion rather than a tally.
 *
 * Derived from the formatter each entry already declares, so it cannot drift
 * from what is rendered. It replaces a `display.endsWith("%")` test, which read
 * the *rendered string* — and would have silently reclassified every rate as a
 * count the moment the percent sign moved for Arabic.
 */
export function isRateMetric(key: string): boolean {
  return RATE_KEYS.has(key);
}

// Only entries with no governed source remain here. Each one is blocked on a
// value the platform may not invent — a cohort rule, a lineage lookback, a
// composite weighting, an exposure threshold, an SLA target, or a capacity
// denominator — so it renders as a state, never as a number.
export const UNCONFIGURED_ANALYTICS=[["Planning-to-submission cohort","Decision required"],["Repeat violation lineage/lookback","Unavailable"],["Risk-to-attention snapshot rules","Decision required"],["Health Score","Not configured"],["Licence exposure","Not configured"],["SLA urgency","Not configured"],["Capacity/utilization","Not configured"]].map(([title,state])=>({title,state}));
