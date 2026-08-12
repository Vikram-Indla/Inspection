import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { RibbonTrack } from "@/components/visits/visit-detail/visit-lifecycle-ribbon";
import type { VisitDetailData } from "./queries";
import { buildVisitDerivations } from "./view";

const PLAN_TONE: Record<string, StatusTone> = {
  published: "info", returned: "warning", cancelled: "danger", expired: "danger", draft: "neutral",
};

export function buildRibbonTracks(
  data: VisitDetailData,
  locale: Locale,
  enumLabel: (value: string) => string,
): RibbonTrack[] {
  const V = getMessages(locale).visits;
  const d = buildVisitDerivations(data, locale);
  const visit = data.visit;
  return [
    {
      id: "planning", domainLabel: V.ribbon.planning,
      stateLabel: enumLabel(visit.planning_status), tone: PLAN_TONE[visit.planning_status] ?? "neutral",
      eventLabel: d.latestAudit
        ? `${enumLabel(d.latestAudit.action)} · ${formatDateTime(d.latestAudit.occurred_at, locale)}`
        : V.ribbon.noEvent,
      sourceLabel: V.ribbon.src.audit,
      boundaryLabel: d.canManage ? V.ribbon.b.manage
        : visit.planning_status === "returned" ? V.ribbon.b.returned
          : visit.planning_status === "published" ? V.ribbon.b.locked : V.ribbon.b.none,
      anchorHref: "#audit", anchorLabel: V.ribbon.a.audit,
    },
    {
      id: "operational", domainLabel: V.ribbon.operational,
      stateLabel: enumLabel(visit.operational_state), tone: "neutral",
      eventLabel: d.latestGeo
        ? `${enumLabel(d.latestGeo.kind)} · ${formatDateTime(d.latestGeo.occurred_at, locale)}`
        : V.ribbon.noJourney,
      sourceLabel: V.ribbon.src.field, boundaryLabel: V.ribbon.b.opRead,
      anchorHref: "#journey", anchorLabel: V.ribbon.a.journey,
    },
    {
      id: "assignment", domainLabel: V.ribbon.assignment,
      stateLabel: d.assignment ? enumLabel(d.assignment.status) : V.ribbon.unassigned,
      tone: d.assignment ? "info" : "neutral",
      eventLabel: d.assignment
        ? `${enumLabel(d.assignment.method)} · ${d.assignment.profiles?.full_name ?? "—"}`
        : V.ribbon.noInspector,
      sourceLabel: V.ribbon.src.assign,
      boundaryLabel: d.canReassign ? V.ribbon.b.reassign : V.ribbon.b.reassignLocked,
      anchorHref: "#config", anchorLabel: V.ribbon.a.config,
    },
    {
      id: "inspection", domainLabel: V.ribbon.inspection,
      stateLabel: d.inspection ? enumLabel(d.inspection.status) : enumLabel("not_started"),
      tone: d.inspection ? "info" : "neutral",
      eventLabel: d.latestSubmission
        ? `v${d.latestSubmission.version_number} · ${formatDateTime(d.latestSubmission.submitted_at, locale)} · ${V.detail.immutable}`
        : V.ribbon.noSub,
      sourceLabel: V.ribbon.src.insp, boundaryLabel: V.ribbon.b.read,
      anchorHref: "#inspection", anchorLabel: V.ribbon.a.insp,
    },
    {
      id: "review", domainLabel: V.ribbon.review,
      stateLabel: d.latestReview ? enumLabel(d.latestReview.decision ?? d.latestReview.status) : V.ribbon.noReview,
      tone: d.latestReview?.decision === "approved" ? "success"
        : d.latestReview?.decision === "rejected" ? "danger"
          : d.latestReview ? "warning" : "neutral",
      eventLabel: d.latestReview?.returned_sections?.length
        ? `${V.detail.returnedSections} ${d.latestReview.returned_sections.join(", ")}`
        : d.latestReview ? enumLabel(d.latestReview.status) : V.ribbon.noReviewEvt,
      sourceLabel: V.ribbon.src.review, boundaryLabel: V.ribbon.b.read,
      anchorHref: "#inspection", anchorLabel: V.ribbon.a.review,
    },
  ];
}
