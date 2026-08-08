import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getMessages, fill } from "@/i18n/messages";
import EmptyState from "@/components/EmptyState";
import { getPlanningAccess } from "@/lib/planning/access";
import {
  queryPlanningVisits, fetchLastUpdates,
  PLANNING_TABS, DEFAULT_PLANNING_SORT, PLANNING_SORT_KEYS,
  type PlanningTab, type PlanningListParams, type PlanningVisitRow,
} from "@/lib/planning/visit-list";
import CreateVisitSection, { type CreateVisitMethod } from "./CreateVisitSection";
import DiscardDraftButton from "./DiscardDraftButton";
import ExportButton from "./ExportButton";
import RefreshButton from "./RefreshButton";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum, sentenceCase } from "@/lib/text";
import { IconBlocked, IconCalendar } from "@/app/icons";
import VisitViewNavigation from "../visits/VisitViewNavigation";
import { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import Button from "@/components/saqeel/button/button";
import PlanningVisitTable, { type PlanningVisitDisplayRow } from "@/components/sections/planning/planning-visit-table/planning-visit-table";
import PlanningFilterBar from "@/components/sections/planning/planning-filter-bar/planning-filter-bar";
import { type SelectOption } from "@/components/saqeel/select/select";

export const dynamic = "force-dynamic";

// CD-020 / SCR-WEB-100 — Planning Visit List (PLN-REQ-005/006/012–018).
// /planning is the canonical list-first landing: KPI/status tabs, server-side
// search + typed filters held entirely in the URL (share-safe; they survive
// detail navigation), the contract columns, Create Visit / Export / Refresh
// page actions, draft continuation and returned work. Access is the canonical
// capability model: business_staff (any authenticated user who is neither
// admin nor inspector) may plan; inspector and admin classes are denied.
// Legacy routes (/planning/bulk, /single, /immediate, /plans) are untouched.

const PAGE_SIZE = 25;

const STATUS_PILL_TONE: Record<string, StatusTone> = {
  draft: "neutral", validated: "neutral", published: "success",
  pending_supervision: "warning", returned: "warning",
  cancelled: "danger", expired: "neutral",
};

const dash = (v: string | null) => (v && v.length > 0 ? v : "—");

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Sp = Record<string, string | string[] | undefined>;

function parseParams(sp: Sp): PlanningListParams {
  const tabRaw = first(sp.tab);
  const tab: PlanningTab = (PLANNING_TABS as readonly string[]).includes(tabRaw) ? (tabRaw as PlanningTab) : "all";
  const sortRaw = first(sp.sort);
  return {
    tab,
    search: first(sp.q).trim(),
    filters: {
      method: first(sp.method) || undefined,
      visitType: first(sp.visitType) || undefined,
      region: first(sp.region) || undefined,
      city: first(sp.city) || undefined,
      inspectorId: first(sp.inspectorId) || undefined,
      windowFrom: first(sp.windowFrom) || undefined,
      windowTo: first(sp.windowTo) || undefined,
      createdFrom: first(sp.createdFrom) || undefined,
      createdTo: first(sp.createdTo) || undefined,
      packageVersionId: first(sp.packageVersionId) || undefined,
      priority: first(sp.priority) || undefined,
      bulkPlanRef: first(sp.bulkPlanRef) || undefined,
    },
    sort: PLANNING_SORT_KEYS.includes(sortRaw) ? sortRaw : DEFAULT_PLANNING_SORT,
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
    pageSize: PAGE_SIZE,
  };
}

// Share-safe URL state: every link (tab, pagination) carries the current
// search/filter/sort state forward; only the intended key changes.
function hrefWith(sp: Sp, overrides: Record<string, string>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = first(v);
    if (val) merged[k] = val;
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v) merged[k] = v; else delete merged[k];
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/planning?${qs}` : "/planning";
}

type DraftRow = {
  id: string; method: string; status: string; plan_reference: string | null;
  draft_version: number; created_at: string; created_by: string;
  profiles: { full_name: string } | null;
};

const continueHref = (d: DraftRow) =>
  d.method === "bulk" ? `/planning/bulk/review?plan=${d.id}`
    : d.method === "single" ? `/planning/single?plan=${d.id}`
      : `/planning/immediate?plan=${d.id}`;

export default async function PlanningHome({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const fmt = (iso: string) => formatDateTime(iso, locale);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb); // identity verified once; the RPC class check below is the access decision

  const access = await getPlanningAccess(sb, ["planning.view", "planning.create", "planning.export", "planning.approve"]);
  const { planning } = getMessages(locale);
  const title = planning.home.title;
  if (access.error) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState icon={<IconBlocked />} title={planning.access.unavailableTitle}
          body={planning.access.unavailableBody} />
      </Shell>
    );
  }
  if (!["business_staff", "admin"].includes(access.accessClass) || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState icon={<IconBlocked />} title={planning.access.unauthorizedTitle}
          body={planning.access.unauthorizedBody} />
      </Shell>
    );
  }

  const params = parseParams(sp);

  // CR-098 / WA-M2-AC-005 — expiry is scheduler-owned. A GET of the Planning
  // list must remain read-only; mutating lifecycle state during page rendering
  // bypasses the canonical transition/audit boundary and can race other users.
  // The list renders the persisted planning status from the scheduled sweep.

  const regionFilter = params.filters.region;
  const [list, lookupsRead, regionsRead, citiesRead, inspectorsRead, packagesRead, draftsRead] = await Promise.all([
    queryPlanningVisits(sb, params),
    sb.from("planning_lookups").select("kind, key, label_en, label_ar").in("kind", ["visit_type", "priority"]).eq("is_active", true).order("sort_order"),
    sb.from("factories").select("region").not("region", "is", null).limit(1000),
    regionFilter
      ? sb.from("factories").select("city").eq("region", regionFilter).not("city", "is", null).limit(1000)
      : sb.from("factories").select("city").not("city", "is", null).limit(1000),
    sb.from("profiles").select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)").eq("user_roles.role_key", "inspector").order("full_name"),
    sb.from("package_versions").select("id, version_label, packages(title)").order("published_at", { ascending: false, nullsFirst: false }).limit(500),
    sb.from("visit_plans").select("id, method, status, plan_reference, draft_version, created_at, created_by, profiles!visit_plans_created_by_fkey(full_name)")
      .in("status", ["draft", "validated"]).is("archived_at", null).order("created_at", { ascending: false }).limit(10),
  ]);

  const optionError = lookupsRead.error ?? regionsRead.error ?? citiesRead.error ?? inspectorsRead.error ?? packagesRead.error ?? draftsRead.error;
  if (!list.ok || optionError) {
    if (optionError) console.error("[planning.list] option/draft read failed:", optionError.message);
    return (
      <Shell current="/planning" title={title}>
        <EmptyState icon={<IconBlocked />} title={planning.access.unavailableTitle}
          body={planning.access.unavailableBody} />
      </Shell>
    );
  }

  const visibleRows = list.rows.filter(row => !isTestFixtureEstablishment({ name: row.factoryName }));
  const lastUpdates = await fetchLastUpdates(sb, visibleRows.map(r => r.id));
  const refUnavailable = planning.table.referenceUnavailable;
  const visitDisplayRows: PlanningVisitDisplayRow[] = visibleRows.map((row: PlanningVisitRow) => {
    const statusKey = row.planningStatus === "validated" ? "draft" : row.planningStatus;
    return {
      id: row.id,
      reference: row.visitReference ?? refUnavailable,
      href: `/visits/${row.id}`,
      planningType: sentenceCase(t(`enum.${row.method}`, humaniseEnum(row.method))),
      statusLabel: sentenceCase(t(`enum.${statusKey}`, humaniseEnum(statusKey))),
      statusTone: STATUS_PILL_TONE[row.planningStatus] ?? "pending",
      operationalState: sentenceCase(t(`enum.${row.operationalState}`, humaniseEnum(row.operationalState))),
      visitType: sentenceCase(t(`enum.${row.visitType}`, humaniseEnum(row.visitType))),
      visitMode: sentenceCase(t(`enum.${row.executionMode}`, humaniseEnum(row.executionMode))),
      priority: row.priority ? sentenceCase(t(`enum.${row.priority}`, humaniseEnum(row.priority))) : "—",
      crNumber: dash(row.crNumber),
      licenceNumber: dash(row.licenseNumber),
      factoryName: dash(row.factoryName),
      region: dash(row.region),
      city: dash(row.city),
      inspector: dash(row.inspectorName),
      windowStart: fmt(row.windowStart),
      windowStartIso: row.windowStart,
      windowEnd: fmt(row.windowEnd),
      windowEndIso: row.windowEnd,
      executionDate: row.executionDate ? fmt(row.executionDate) : "—",
      packages: row.packageTitles.length > 0 ? row.packageTitles.join(", ") : "—",
      createdBy: dash(row.createdBy),
      createdDate: fmt(row.createdAt),
      createdDateIso: row.createdAt,
      sourceChannel: dash(row.sourceChannel),
      returnStatus: dash(row.returnReason ?? (row.planningStatus === "returned" ? sentenceCase(t("enum.returned", humaniseEnum("returned"))) : null)),
      bulkPlanRef: row.method === "bulk" ? dash(row.planReference) : "—",
      lastUpdate: lastUpdates[row.id] ? fmt(lastUpdates[row.id]) : "—",
    };
  });

  const lookups = (lookupsRead.data ?? []) as { kind: string; key: string; label_en: string; label_ar: string | null }[];
  const lookupLabel = (l: { label_en: string; label_ar: string | null }) => (locale === "ar" ? (l.label_ar ?? l.label_en) : l.label_en);
  const visitTypeOptions = lookups.filter(l => l.kind === "visit_type");
  const priorityOptions = lookups.filter(l => l.kind === "priority");
  const distinct = (rows: Record<string, unknown>[], key: string) =>
    [...new Set(rows.map(r => r[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
  const regionOptions = distinct((regionsRead.data ?? []) as Record<string, unknown>[], "region");
  const cityOptions = distinct((citiesRead.data ?? []) as Record<string, unknown>[], "city");
  // A role join can surface the same person more than once. Keep one choice per
  // user and disambiguate genuinely matching names instead of making an
  // assignment decision depend on an invisible ID.
  const inspectorById = new Map<string, string>();
  for (const row of inspectorsRead.data ?? []) {
    const userId = row.user_id as string;
    if (!inspectorById.has(userId)) inspectorById.set(userId, row.full_name as string);
  }
  const inspectorNameCount = new Map<string, number>();
  for (const name of inspectorById.values()) inspectorNameCount.set(name, (inspectorNameCount.get(name) ?? 0) + 1);
  const inspectors = [...inspectorById.entries()]
    .map(([user_id, full_name]) => ({
      user_id,
      full_name,
      label: (inspectorNameCount.get(full_name) ?? 0) > 1 ? `${full_name} · ${user_id.slice(0, 8)}` : full_name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const packageOptions = ((packagesRead.data ?? []) as unknown as { id: string; version_label: string; packages: { title: string } | null }[])
    .map(p => ({ id: p.id, label: `${p.packages?.title ?? "—"} · ${p.version_label}` }));
  const drafts = (draftsRead.data ?? []) as unknown as DraftRow[];

  const methods: CreateVisitMethod[] = [
    { glyph: "▦", title: planning.methods.bulkTitle, desc: planning.methods.bulkDesc, href: "/planning/bulk" },
    { glyph: "▣", title: planning.methods.singleTitle, desc: planning.methods.singleDesc, href: "/planning/single" },
    { glyph: "⚡", title: planning.methods.immediateTitle, desc: planning.methods.immediateDesc, href: "/planning/immediate" },
  ];

  const enumLabel = (value: string) => sentenceCase(t(`enum.${value}`, humaniseEnum(value)));
  const tabLabels: Record<PlanningTab, string> = {
    all: planning.tabs.all,
    draft: enumLabel("draft"),
    pending_supervision: planning.tabs.pendingSupervision,
    published: enumLabel("published"),
    returned: enumLabel("returned"),
    cancelled: enumLabel("cancelled"),
    expired: enumLabel("expired"),
  };

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const page = Math.min(list.page, totalPages);
  const advLabels: Record<string, string> = {
    method: planning.filter.method, visitType: planning.filter.visitType, priority: planning.filter.priority,
    region: planning.filter.region, city: planning.filter.city, packageVersionId: planning.filter.reportPackage,
    createdFrom: planning.filter.createdFrom, createdTo: planning.filter.createdTo, bulkPlanRef: planning.filter.bulkPlanRef,
  };
  const activeFilters = [
    params.search ? { label: `${planning.filter.searchLabel} · ${params.search}`, href: hrefWith(sp, { q: "", page: "" }) } : null,
    params.tab !== "all" ? { label: `${planning.filter.status} · ${tabLabels[params.tab]}`, href: hrefWith(sp, { tab: "", page: "" }) } : null,
    params.filters.inspectorId ? { label: `${planning.filter.inspector} · ${inspectors.find(i => i.user_id === params.filters.inspectorId)?.label ?? params.filters.inspectorId}`, href: hrefWith(sp, { inspectorId: "", page: "" }) } : null,
    params.filters.windowFrom || params.filters.windowTo ? { label: `${planning.filter.visitDate} · ${params.filters.windowFrom || "…"} — ${params.filters.windowTo || "…"}`, href: hrefWith(sp, { windowFrom: "", windowTo: "", page: "" }) } : null,
    ...(["method", "visitType", "priority", "region", "city", "packageVersionId", "createdFrom", "createdTo", "bulkPlanRef"] as const)
      .map(key => params.filters[key] ? { label: `${advLabels[key]} · ${params.filters[key]}`, href: hrefWith(sp, { [key]: "", page: "" }) } : null),
  ].filter((filter): filter is { label: string; href: string } => Boolean(filter));
  // The badge belongs to the expandable panel only. Status, Inspector and
  // Visit date are already visible in the primary row, so including them here
  // falsely suggests that hidden filters are active.
  const advancedFilterCount = (["method", "visitType", "priority", "region", "city", "packageVersionId", "createdFrom", "createdTo", "bulkPlanRef"] as const)
    .filter(key => Boolean(params.filters[key])).length;
  const visitDatePresets = [
    { id: "today", label: planning.filter.presetToday, days: 1, direction: "future" as const },
    { id: "next7", label: planning.filter.presetNext7, days: 7, direction: "future" as const },
    { id: "next30", label: planning.filter.presetNext30, days: 30, direction: "future" as const },
  ];
  const allOption: SelectOption = { value: "", label: planning.filter.all };
  const statusOptions: SelectOption[] = PLANNING_TABS.map(tab => ({
    value: tab === "all" ? "" : tab,
    label: tabLabels[tab],
    count: list.countsAvailable ? list.counts[tab] : undefined,
  }));
  const inspectorOptions: SelectOption[] = [{ value: "", label: planning.filter.allInspectors }, ...inspectors.map(i => ({ value: i.user_id, label: i.label }))];
  const sortOptions: SelectOption[] = PLANNING_SORT_KEYS.map(key => ({ value: key, label: (planning.filter.sort as Record<string, string>)[key] ?? key }));
  const methodOptions: SelectOption[] = [allOption, ...["bulk", "single", "immediate"].map(m => ({ value: m, label: sentenceCase(t(`enum.${m}`, humaniseEnum(m))) }))];
  const visitTypeSelectOptions: SelectOption[] = [allOption, ...visitTypeOptions.map(o => ({ value: o.key, label: lookupLabel(o) }))];
  const prioritySelectOptions: SelectOption[] = [allOption, ...priorityOptions.map(o => ({ value: o.key, label: lookupLabel(o) }))];
  const regionSelectOptions: SelectOption[] = [allOption, ...regionOptions.map(r => ({ value: r, label: r }))];
  const citySelectOptions: SelectOption[] = [allOption, ...cityOptions.map(c => ({ value: c, label: c }))];
  const packageSelectOptions: SelectOption[] = [allOption, ...packageOptions.map(p => ({ value: p.id, label: p.label }))];
  const filterChips = activeFilters.map((filter, index) => ({ key: `chip-${index}`, label: filter.label, href: filter.href }));

  return (
    <Shell current="/planning" title="">
      <VisitViewNavigation active="list" ariaLabel={planning.views.aria}
        labels={{ list: planning.views.list, calendar: planning.views.calendar, map: planning.views.map, workload: planning.views.workload }}
        basePath="/planning" />
      <div className="sq-planning-heading">
        <h1>{title}</h1>
        <span>{planning.home.subtitle}</span>
      </div>
      {/* Page actions are intentional: creation and scoped export only. */}
      <CreateVisitSection methods={methods} canCreate={access.can("planning.create")} strings={{
        createLabel: planning.home.createVisit,
        oneMethodNote: planning.home.oneMethod,
      }}>
        {access.can("planning.export") && (
          <ExportButton params={params} strings={{
            label: planning.actions.export,
            busyLabel: planning.actions.exporting,
            unauthorized: planning.actions.exportUnauthorized,
            unavailable: planning.actions.exportUnavailable,
            cappedNote: planning.actions.exportCapped,
          }} />
        )}
        <RefreshButton
          label={planning.actions.refresh}
          busyLabel={planning.actions.refreshing}
        />
        <Button variant="tertiary" href="/planning/visits">
          {planning.home.visitManagement}
        </Button>
      </CreateVisitSection>

      {/* The toolbar is one line on desktop. Its two disclosures expand inline
          below the controls so a planner can adjust filters and read results in
          one continuous flow — never through an overlay. */}
      <PlanningFilterBar
        locale={locale}
        action="/planning"
        strings={planning.filter}
        search={params.search}
        status={params.tab === "all" ? "" : params.tab}
        statusOptions={statusOptions}
        inspector={params.filters.inspectorId ?? ""}
        inspectorOptions={inspectorOptions}
        windowFrom={params.filters.windowFrom ?? ""}
        windowTo={params.filters.windowTo ?? ""}
        datePresets={visitDatePresets}
        sort={params.sort}
        sortOptions={sortOptions}
        method={params.filters.method ?? ""}
        methodOptions={methodOptions}
        visitType={params.filters.visitType ?? ""}
        visitTypeOptions={visitTypeSelectOptions}
        priority={params.filters.priority ?? ""}
        priorityOptions={prioritySelectOptions}
        region={params.filters.region ?? ""}
        regionOptions={regionSelectOptions}
        city={params.filters.city ?? ""}
        cityOptions={citySelectOptions}
        reportPackage={params.filters.packageVersionId ?? ""}
        packageOptions={packageSelectOptions}
        createdFrom={params.filters.createdFrom ?? ""}
        createdTo={params.filters.createdTo ?? ""}
        bulkPlanRef={params.filters.bulkPlanRef ?? ""}
        advancedCount={advancedFilterCount}
        chips={filterChips}
        clearHref="/planning"
      />

      {/* Canonical visit list (PLN-REQ-013)
          INSP-738 — visibleRows and list.total can legitimately disagree: the
          count query and the row query exclude fixtures through separate code
          paths (see lib/planning/visit-list.ts), and each is independently
          scoped by RLS. When that happens with no filter/search/tab active,
          telling the planner to "reset filters" is actively wrong — there is
          nothing to reset. Distinguish the two cases instead of reusing one
          message for both. */}
      {visibleRows.length === 0 ? (
        activeFilters.length > 0 ? (
          <EmptyState icon={<IconCalendar />} title={planning.list.emptyTitle}
            body={planning.list.emptyBody} />
        ) : (
          <EmptyState icon={<IconCalendar />} title={planning.list.emptyUnfilteredTitle}
            body={list.total > 0
              ? fill(planning.list.emptyUnfilteredWithTotal, { total: list.total })
              : planning.list.emptyUnfilteredNoTotal} />
        )
      ) : (
        <PlanningVisitTable
          rows={visitDisplayRows}
          strings={{
            caption: planning.table.caption,
            reference: planning.table.colVisitRef,
            planningType: planning.table.colPlanningType,
            planningStatus: planning.table.colPlanningStatus,
            operationalState: planning.table.colOperationalState,
            visitType: planning.table.colVisitType,
            visitMode: planning.table.colVisitMode,
            priority: planning.table.colPriority,
            crNumber: planning.table.colCrNumber,
            licenceNumber: planning.table.colLicenceNumber,
            factoryName: planning.table.colFactoryName,
            region: planning.table.colRegion,
            city: planning.table.colCity,
            inspector: planning.table.colInspector,
            windowStart: planning.table.colWindowStart,
            windowEnd: planning.table.colWindowEnd,
            executionDate: planning.table.colExecutionDate,
            packages: planning.table.colPackages,
            createdBy: planning.table.colCreatedBy,
            createdDate: planning.table.colCreatedDate,
            sourceChannel: planning.table.colSourceChannel,
            returnStatus: planning.table.colReturnStatus,
            bulkPlanRef: planning.table.colBulkPlanRef,
            lastUpdate: planning.table.colLastUpdate,
            emptyTitle: planning.table.empty,
          }}
        />
      )}

      {/* Pagination — state carried in the URL like every other control.
          INSP-738 — gated on visibleRows, not list.total: list.total can be
          nonzero while nothing is displayable (see the empty-state block
          above), and a "Showing 0 of N" footer under an empty-state message
          is the exact contradiction this fixes. */}
      {visibleRows.length > 0 && (
        <div className="sq-row sq-row--spread">
          <span className="sq-caption sq-numeric">
            {fill(planning.list.showing, { shown: visibleRows.length, total: list.total, page, pages: totalPages })}
          </span>
          <div className="sq-row">
            {page > 1 && <a className="sq-btn sq-btn--subtle" href={hrefWith(sp, { page: String(page - 1) })}>{planning.list.prev}</a>}
            {page < totalPages && <a className="sq-btn sq-btn--subtle" href={hrefWith(sp, { page: String(page + 1) })}>{planning.list.next}</a>}
          </div>
        </div>
      )}

      {/* Draft continuation (PLN-REQ-010 entry point; resume consumption is a later phase) */}
      {drafts.length > 0 && (
        <section className="sq-surface sq-panel sq-panel--roomy">
          <h3>{planning.list.draftsHeading}</h3>
          <div className="sq-tablewrap"><table className="sq-table planning-draft-table">
            <thead><tr>
              <th scope="col">{planning.list.colPlanRef}</th>
              <th scope="col">{planning.list.colPlanningType}</th>
              <th scope="col">{planning.list.colPlanningStatus}</th>
              <th scope="col">{planning.list.colCreatedBy}</th>
              <th scope="col" className="sq-td-num">{planning.list.colCreatedDate}</th>
              <th scope="col">{planning.list.colContinue}</th>
              <th scope="col">{planning.list.colDiscard}</th>
            </tr></thead>
            <tbody>
              {drafts.map(d => (
                <tr key={d.id}>
                  <td className="sq-numeric"><strong>{d.plan_reference ?? planning.table.referenceUnavailable}</strong></td>
                  <td><span className="planning-method">{enumLabel(d.method)}</span></td>
                  <td><span className="badge badge-draft planning-status"><span className="dot" aria-hidden="true" />{enumLabel("draft")}</span></td>
                  <td>{d.profiles?.full_name ?? "—"}</td>
                  <td className="sq-td-num sq-numeric">{fmt(d.created_at)}</td>
                  <td><a className="sq-link" href={continueHref(d)}>{planning.list.continue}</a></td>
                  <td>
                    {/* M8 / PLN-CON-018 — discard is offered on OWN drafts only
                        (same ownership boundary as resume); the copy stays
                        distinct from cancelling a published visit. */}
                    {user && d.created_by === user.id ? (
                      <DiscardDraftButton planId={d.id} expectedVersion={d.draft_version}
                        label={planning.list.discard}
                        discardAria={fill(planning.list.discardAria, { ref: d.plan_reference ?? planning.table.referenceUnavailable })} />
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {/* FIX WAVE F4 — M02-035 plan register entry point (preserved) */}
      <p><a className="sq-link" href="/planning/plans">{planning.links.register}</a></p>
      <p><a className="sq-link" href="/tasks">{planning.links.tasks}</a></p>
      {access.can("planning.approve") && <p><a className="sq-link" href="/planning/supervision">{planning.links.supervision}</a></p>}
      {/* M8 — /visits is the accepted management alias surface; the two are
          cross-linked in both directions (canonical §5/§6 reconciliation). */}
      <p><a className="sq-link" href="/visits">{planning.links.visits}</a></p>
    </Shell>
  );
}
