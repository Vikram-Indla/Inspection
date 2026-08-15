import { type ReactNode } from "react";
import type { Definition } from "@/components/saqeel/definition-list/definition-list";
import { Text } from "@/components/saqeel/type";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { VisitDetailData } from "@/features/visits/detail/queries";
import {
  buildAuditEntries, buildJourneyEntries, buildLifecycleEntries, buildLocationEntries,
  buildVisitDerivations, snapshotText, type TimedEntry,
} from "@/features/visits/detail/view";
import { buildRibbonTracks } from "@/features/visits/detail/ribbon";
import VisitHistory, { type HistorySection } from "./visit-history";
import VisitLifecycleRibbon from "./visit-lifecycle-ribbon";
import VisitSummary, { type GovernedNotice } from "./visit-summary";
import styles from "./visit-detail.module.css";

export default function VisitDetail({ data, locale, enumLabel, actions, notes, attachments }: {
  data: VisitDetailData;
  locale: Locale;
  enumLabel: (value: string) => string;
  actions: ReactNode;
  notes: ReactNode;
  attachments: ReactNode;
}) {
  const V = getMessages(locale).visits;
  const d = buildVisitDerivations(data, locale);
  const visit = data.visit;
  const plan = visit.visit_plans;
  const actor = (value: string | null) => {
    if (!value) return V.detail.auditSystem;
    const name = data.actorNames.get(value);
    return V.detail.auditActor.replace("{who}", name ?? V.detail.auditActorUnknown);
  };

  const tracks = buildRibbonTracks(data, locale, enumLabel);

  const configItems: Definition[] = [
    { label: V.detail.window, value: d.windowLabel },
    { label: V.detail.configuration, value: `${enumLabel(visit.visit_type)} · ${enumLabel(visit.execution_mode)}` },
    {
      label: V.detail.assignment,
      value: d.assignment
        ? `${d.assignment.profiles?.full_name ?? "—"} (${enumLabel(d.assignment.method)})`
        : "—",
    },
  ];

  const inspectionItems: Definition[] = d.inspection
    ? [
      { label: V.ribbon.inspection, value: enumLabel(d.inspection.status) },
      ...d.submissions.map(submission => ({
        label: `v${submission.version_number}`,
        value: `${formatDateTime(submission.submitted_at, locale)} · ${V.detail.immutable}`,
      })),
      ...d.reviews.map((review, index) => ({
        label: `${V.detail.reviewPrefix} ${index + 1}`,
        value: enumLabel(review.decision ?? review.status),
      })),
    ]
    : [];

  const planItems: Definition[] = plan
    ? [
      { label: V.detail.planHeading, value: `${enumLabel(plan.method)} · ${plan.plan_reference ?? plan.id.slice(0, 8)}` },
      { label: V.detail.planCreatedBy, value: plan.profiles?.full_name ?? "—" },
      { label: V.detail.planPublishedAt, value: plan.published_at ? formatDateTime(plan.published_at, locale) : "—" },
      { label: V.detail.planStatus, value: enumLabel(plan.status) },
      { label: V.detail.siblingsLabel, value: String(data.siblingCount) },
    ]
    : [];

  const packageEntries: TimedEntry[] = data.packageLinks.map(link => ({
    id: link.id,
    dateTime: link.added_at,
    time: formatDateTime(link.added_at, locale),
    title: snapshotText(link.snapshot, "code") ?? link.package_version_id.slice(0, 8),
    meta: [
      snapshotText(link.snapshot, "version_label"),
      link.package_version_id === visit.package_version_id ? V.detail.primaryPackage : null,
    ].filter(Boolean).join(" · ") || null,
    detail: snapshotText(link.snapshot, "title"),
    accent: link.package_version_id === visit.package_version_id,
  }));

  const notices: GovernedNotice[] = [
    d.returnReason
      ? {
        id: "returned", tone: "warning" as const,
        text: [
          V.detail.returnReason.replace("{reason}", d.returnReason),
          d.latestReturn?.comments,
          d.latestReturn ? formatDateTime(d.latestReturn.created_at, locale) : null,
        ].filter(Boolean).join(" · "),
      }
      : null,
    visit.planning_status === "cancelled" && d.cancelReasonDisplay
      ? {
        id: "cancelled", tone: "danger" as const,
        text: [
          V.detail.cancelledReason.replace("{reason}", d.cancelReasonDisplay),
          d.latestCancel?.comments,
        ].filter(Boolean).join(" · "),
      }
      : null,
    visit.planning_status === "expired"
      ? {
        id: "expired", tone: "muted" as const,
        text: V.detail.expiredReason.replace("{reason}", data.expiryRuleReason ?? V.detail.expiredUnknown),
      }
      : null,
  ].filter((notice): notice is GovernedNotice => notice !== null);

  const plannedPin = visit.planner_lat != null && visit.planner_lng != null
    ? `${visit.planner_lat}, ${visit.planner_lng}`
    : V.detail.locationFactory;

  const sections: HistorySection[] = [
    {
      id: "lifecycle", heading: V.detail.lifecycleHeading, empty: V.detail.noLifecycle,
      entries: buildLifecycleEntries(data.lifecycle, data.returnReasons, data.cancelReasons, locale, enumLabel, actor),
    },
    {
      id: "location", heading: V.detail.locationHeading, empty: V.detail.noLocation,
      entries: buildLocationEntries(data, locale, enumLabel, actor),
      lead: <Text as="p" role="label" tone="secondary">{`${V.detail.locationPlanned} ${plannedPin}`}</Text>,
    },
    {
      id: "journey", heading: V.detail.journeyHeading, empty: V.detail.noJourney,
      entries: buildJourneyEntries(d.geoEvents, locale, enumLabel, metres => metres == null ? "" : `±${metres} m`),
    },
    {
      id: "audit", heading: V.detail.auditHeading, empty: V.detail.noAudit,
      entries: buildAuditEntries(data, locale, enumLabel, actor),
    },
  ];

  return (
    <div className={styles.screen}>
      <VisitLifecycleRibbon
        tracks={tracks}
        strings={{
          heading: V.ribbon.heading,
          tablistLabel: V.ribbon.tablist,
          latestWord: V.ribbon.latestWord,
          boundaryWord: V.ribbon.boundaryWord,
        }}
      />
      {actions}
      <VisitSummary
        configTitle={V.detail.configuration}
        configItems={configItems}
        factoryHref={visit.factories ? `/factories/${visit.factories.id}` : null}
        factoryLabel={V.detail.factory360}
        provenance={visit.immediate_creator_role || visit.source_channel
          ? [
            V.detail.immediateProvenance,
            visit.immediate_creator_role === "inspector" ? V.detail.creatorInspector : V.detail.creatorPlanner,
            visit.internal_reference ? `${V.detail.manualReason} ${visit.internal_reference}` : null,
            visit.source_channel,
          ].filter(Boolean).join(" · ")
          : null}
        inspectionTitle={V.detail.inspectionVersions}
        inspectionItems={inspectionItems}
        inspectionEmpty={V.detail.notStarted}
        reportHref={d.inspection ? `/reports/inspection/${d.inspection.id}` : null}
        reportLabel={V.detail.reportLink}
        planTitle={V.detail.planHeading}
        planItems={planItems}
        planHref={plan ? `/planning/plans/${plan.id}` : null}
        planLabel={V.detail.openPlan}
        planEmpty={V.detail.noPlan}
        packagesTitle={V.detail.packagesHeading}
        packagesEmpty={V.detail.noPackages}
        packageEntries={packageEntries}
        notices={notices}
      />
      {notes}
      {attachments}
      <VisitHistory title={V.detail.historyTitle} description={V.detail.historyDescription} sections={sections} />
    </div>
  );
}
