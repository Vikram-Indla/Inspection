import { fill, getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { FactoryMetric } from "@/components/sections/factories/factory-snapshot/factory-snapshot";
import type { TrendPoint } from "@/components/sections/factories/factory-trends/factory-trends";
import type { FactorySection } from "@/components/sections/factories/factory-sections/factory-sections";
import type { PortfolioStrings } from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import type { FactoryContextStrings } from "@/components/sections/factories/factory-context/factory-context";
import type { FactoryOverviewStrings } from "@/components/sections/factories/factory-overview/factory-overview";
import type { FactoryAiAdvisoryStrings } from "@/components/sections/factories/factory-ai-advisory/factory-ai-advisory";
import type {
  ComplianceReportRow, ComplianceViolationRow, CompliancePenaltyRow,
} from "@/components/sections/factories/factory-compliance/factory-compliance";
import {
  conditionOf, licenceExpiryState, titleCase, LICENCE_EXPIRY_SOON_DAYS, type FactoryRow,
} from "./portfolio";
import type { PortfolioCounts } from "./portfolio-counts";
import type { FactoryCompliance } from "./compliance";
import type { FactoryProfileRecord } from "./profile";
import type { FactoryProfileGroup } from "@/components/sections/factories/factory-profile/factory-profile";
import type { FactoryRiskMovement } from "./risk-context";

const DECISION_TONE: Record<string, StatusTone> = { approve: "success", return: "warning", reject: "danger" };
const LEVEL_TONE: Record<string, StatusTone> = { critical: "danger", major: "warning", minor: "info" };
const PENALTY_TONE: Record<string, StatusTone> = {
  issued: "warning", served: "warning", settled: "success", withdrawn: "neutral",
};
const EMPTY_COMPLIANCE: FactoryCompliance = { reports: [], violations: [], penalties: [] };

const alertTone = (value: number | null, raised: StatusTone): StatusTone =>
  (value === null || value === 0 ? "neutral" : raised);

export type FactoryView = {
  readonly condition: { readonly label: string; readonly tone: StatusTone };
  readonly conditionReasons: readonly string[];
  readonly metrics: readonly FactoryMetric[];
  readonly sections: readonly FactorySection[];
  readonly sources: readonly { key: string; label: string; state: string; tone: StatusTone }[];
  readonly latestChange: string;
  readonly trendSeries: readonly TrendPoint[];
  readonly riskDelta: string | null;
  readonly riskTone: StatusTone;
  readonly riskCurrent: string;
  readonly compliance: {
    readonly reports: readonly ComplianceReportRow[];
    readonly violations: readonly ComplianceViolationRow[];
    readonly penalties: readonly CompliancePenaltyRow[];
  };
  readonly lastSynchronised: string;
  readonly profileGroups: readonly FactoryProfileGroup[];
  readonly strings: {
    readonly context: FactoryContextStrings;
    readonly overview: FactoryOverviewStrings;
    readonly portfolio: PortfolioStrings;
    readonly advisory: FactoryAiAdvisoryStrings;
  };
};

export function buildFactoryView({ factory, locale, counts, movement, compliance, profile, now, freshnessUnavailable, sourceStatus }: {
  factory: FactoryRow;
  locale: "en" | "ar";
  counts: PortfolioCounts;
  movement: FactoryRiskMovement | null;
  compliance: FactoryCompliance | undefined;
  profile: FactoryProfileRecord | undefined;
  now: number;
  freshnessUnavailable: string;
  sourceStatus: string;
}): FactoryView {
  const { factories: copy } = getMessages(locale);
  const missing = copy.portfolio.missing;
  const day = (iso: string | null) => (iso ? formatDate(iso, locale) : missing);
  const records = compliance ?? EMPTY_COMPLIANCE;

  const condition = conditionOf(factory.risk_band, {
    critical: copy.condition.critical,
    attention: copy.condition.attention,
    stable: copy.condition.stable,
    unavailable: copy.condition.unavailable,
  });

  const openViolations = counts.openViolationsAvailable ? counts.openViolations.get(factory.id) ?? 0 : null;
  const activePenalties = counts.activePenaltiesAvailable ? counts.activePenalties.get(factory.id) ?? 0 : null;
  const products = counts.productsAvailable ? counts.products.get(factory.id) ?? 0 : null;
  const inspectedAt = counts.lastInspection.get(factory.id) ?? null;
  const daysSince = inspectedAt === null ? null : Math.floor((now - new Date(inspectedAt).getTime()) / 86_400_000);
  const expiry = licenceExpiryState(factory.license?.expiry_date ?? null, now);

  const numberMetric = (key: string, label: string, value: number | null, tone: StatusTone): FactoryMetric => ({
    key,
    label,
    value: value === null ? copy.snapshot.notAvailable : String(value),
    tone: value === null ? "neutral" : tone,
    kind: value === null ? "text" : "number",
  });

  const riskChange = movement?.previous ? movement.latest.score - movement.previous.score : null;

  return {
    condition,
    conditionReasons: [
      openViolations !== null && openViolations > 0 ? fill(copy.reason.openViolations, { n: openViolations }) : null,
      daysSince === null ? copy.reason.neverInspected : fill(copy.reason.inspectedDaysAgo, { n: daysSince }),
      expiry === "expired" ? copy.reason.licenceExpired : null,
      expiry === "expiringSoon" ? fill(copy.reason.licenceExpiring, { n: LICENCE_EXPIRY_SOON_DAYS }) : null,
    ].filter((reason): reason is string => reason !== null),

    metrics: [
      numberMetric("riskScore", copy.snapshot.riskScore, factory.risk_score, condition.tone),
      {
        key: "latestInspection",
        label: copy.snapshot.latestInspection,
        value: inspectedAt === null ? copy.snapshot.never : day(inspectedAt),
        tone: "neutral",
        kind: "text",
      },
      numberMetric("openViolations", copy.snapshot.openViolations, openViolations, alertTone(openViolations, "danger")),
      numberMetric("activePenalties", copy.snapshot.activePenalties, activePenalties, alertTone(activePenalties, "warning")),
      numberMetric("employees", copy.snapshot.employees, factory.employees_total, "neutral"),
      numberMetric("products", copy.snapshot.products, products, "neutral"),
    ],

    sections: ([
      ["inspectionHistory", copy.sections.items.inspectionHistory],
      ["violations", copy.sections.items.violations],
      ["industrial", copy.sections.items.industrial],
      ["documents", copy.sections.items.documents],
    ] as const).map(([key, item]) => ({
      key,
      title: item.title,
      body: item.body,
      openLabel: fill(copy.sections.open, { title: item.title }),
      href: factory.dossier_href,
    })),

    sources: [
      {
        key: "senaei",
        label: copy.context.sources.senaei,
        state: factory.source_synced_at ? copy.context.sources.synced : copy.context.sources.notSynced,
        tone: factory.source_synced_at ? "success" : "neutral",
      },
      {
        key: "riskEngine",
        label: copy.context.sources.riskEngine,
        state: movement ? copy.context.sources.calculated : copy.context.sources.notCalculated,
        tone: movement ? "success" : "neutral",
      },
    ],

    latestChange: movement === null
      ? copy.context.change.none
      : movement.previous === null
        ? copy.context.change.first
        : fill(copy.context.change.moved, {
          from: movement.previous.score,
          to: movement.latest.score,
          date: day(movement.latest.calculatedAt),
        }),

    trendSeries: (movement?.series ?? []).map((snapshot, index) => ({
      key: `${snapshot.calculatedAt ?? index}`,
      value: snapshot.score,
      label: `${snapshot.score} · ${day(snapshot.calculatedAt)}`,
    })),
    riskDelta: riskChange === null
      ? (movement ? copy.trends.firstCalculation : null)
      : fill(riskChange > 0 ? copy.trends.rising : riskChange < 0 ? copy.trends.falling : copy.trends.steady,
        { n: Math.abs(riskChange) }),
    riskTone: riskChange === null || riskChange === 0 ? "neutral" : riskChange > 0 ? "danger" : "success",
    riskCurrent: movement ? String(movement.latest.score) : copy.snapshot.notAvailable,

    compliance: {
      reports: records.reports.map(report => ({
        id: report.id,
        reference: report.reference ?? missing,
        recorded: day(report.recordedAt),
        recordedIso: report.recordedAt,
        status: report.status ? titleCase(report.status) : missing,
        statusTone: "neutral",
        decision: report.decision ? titleCase(report.decision) : copy.compliance.noDecision,
        decisionTone: report.decision ? DECISION_TONE[report.decision] ?? "neutral" : null,
      })),
      violations: records.violations.map(violation => ({
        id: violation.id,
        title: violation.title ?? missing,
        code: violation.code ?? missing,
        level: violation.level ? titleCase(violation.level) : missing,
        levelTone: violation.level ? LEVEL_TONE[violation.level] ?? "neutral" : "neutral",
        recorded: day(violation.recordedAt),
        recordedIso: violation.recordedAt,
      })),
      penalties: records.penalties.map(penalty => ({
        id: penalty.id,
        noticeNumber: penalty.noticeNumber,
        status: titleCase(penalty.status),
        statusTone: PENALTY_TONE[penalty.status] ?? "neutral",
        issued: day(penalty.issuedAt),
        issuedIso: penalty.issuedAt,
        violation: penalty.violationTitle ?? missing,
      })),
    },

    lastSynchronised: factory.source_synced_at ? day(factory.source_synced_at) : freshnessUnavailable,

    profileGroups: [
      {
        key: "identity",
        label: copy.profile.identity,
        facts: [
          { label: copy.profile.sector, value: copy.snapshot.notAvailable },
          { label: copy.profile.activity, value: titleCase(factory.activity_class) },
        ],
      },
      {
        key: "location",
        label: copy.profile.location,
        facts: [
          { label: copy.profile.region, value: factory.region ?? missing },
          { label: copy.profile.city, value: factory.city ?? missing },
        ],
      },
      {
        key: "contacts",
        label: copy.profile.contacts,
        facts: profile?.contact
          ? [
            { label: copy.profile.contact, value: profile.contact.name },
            { label: copy.profile.role, value: profile.contact.role ?? missing },
            { label: copy.profile.phone, value: profile.contact.phone ?? missing },
          ]
          : [{ label: copy.profile.contact, value: copy.profile.noContact }],
      },
    ],

    strings: {
      context: {
        selectedContext: copy.workspace.context,
        cr: copy.snapshot.commercialRegistration,
        licence: copy.hero.industrialLicence,
        plant: copy.portfolio.plantNumber,
        sourceStatus,
        missing,
      },
      overview: {
        opened: copy.hero.opened,
        plannerNote: copy.hero.plannerNote,
        plantNumber: copy.portfolio.plantNumber,
        licenceType: copy.hero.licenceType,
        stage: copy.hero.stage,
        licenceState: copy.snapshot.licenceState,
        createInspection: copy.action.createInspection,
        viewOnMap: copy.action.viewOnMap,
        openProfile: copy.action.openProfile,
        missing,
      },
      advisory: {
        title: copy.context.advisory.title,
        advisory: copy.context.advisory.advisory,
        evidence: copy.context.advisory.evidence,
        idle: copy.context.advisory.idle,
        generate: copy.context.advisory.generate,
        generating: copy.context.advisory.generating,
        confidenceUnavailable: copy.context.advisory.confidenceUnavailable,
      },
      portfolio: {
        portfolio: copy.portfolio.portfolio,
        factories: copy.portfolio.factories,
        highRisk: copy.portfolio.highRisk,
        openViolations: copy.portfolio.openViolations,
        activePenalties: copy.portfolio.activePenalties,
        licenceNumber: copy.portfolio.licenceNumber,
        plantNumber: copy.portfolio.plantNumber,
        type: copy.portfolio.type,
        stage: copy.portfolio.stage,
        expiry: copy.portfolio.expiry,
        notAvailable: copy.portfolio.notAvailable,
        missing,
        riskHigh: copy.risk.high,
        riskMedium: copy.risk.medium,
        riskLow: copy.risk.low,
        expired: copy.portfolio.expired,
        expiringSoon: copy.portfolio.expiringSoon,
      },
    },
  };
}
