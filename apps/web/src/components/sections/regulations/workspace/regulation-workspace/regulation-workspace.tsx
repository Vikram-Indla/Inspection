import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { titleCase } from "@/features/factories/portfolio";
import { regulationHref, WORKSPACE_TABS, type RegulationScope, type WorkspaceTab } from "@/features/regulations/params";
import { readRegulationWorkspace } from "@/features/regulations/workspace-source";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./regulation-workspace.module.css";
import RegulationAudit from "../regulation-audit/regulation-audit";
import RegulationItems from "../regulation-items/regulation-items";
import RegulationOverview from "../regulation-overview/regulation-overview";
import RegulationPenalties from "../regulation-penalties/regulation-penalties";
import RegulationVersions from "../regulation-versions/regulation-versions";
import RegulationViolations from "../regulation-violations/regulation-violations";

export default async function RegulationWorkspace({ locale, scope }: {
  locale: Locale;
  scope: RegulationScope;
}) {
  const { regulations } = getMessages(locale);
  const workspace = await readRegulationWorkspace(scope.selectedId);

  if (!workspace) {
    return (
      <Card as="section" labelledBy="regulation-workspace">
        <CardHeader level="h2" titleId="regulation-workspace" title={regulations.workspace.notFoundTitle} />
        <CardBody>
          <EmptyState title={regulations.workspace.notFoundBody} size="sm" />
        </CardBody>
      </Card>
    );
  }

  const { regulation } = workspace;
  const labelFor = (value: string) => regulations.enum[value as keyof typeof regulations.enum] ?? titleCase(value);
  const statusLabel = regulations.status[regulation.operational_status as keyof typeof regulations.status]
    ?? titleCase(regulation.operational_status);
  const day = (iso: string) => formatDate(iso, locale);
  const items = workspace.items.kind === "rows" ? workspace.items.rows : [];
  const violations = workspace.violations.kind === "rows" ? workspace.violations.rows : [];
  const requestHref = (requestId: string) => localeHref(locale, `/admin/compliance-requests/${requestId}`);
  const unreadable = (records: string) =>
    <EmptyState tone="warning" title={fill(regulations.workspace.unavailable, { records })} size="sm" />;

  const tabLabels: Readonly<Record<WorkspaceTab, string>> = {
    overview: regulations.workspace.overview,
    items: regulations.workspace.items,
    violations: regulations.workspace.violations,
    penalties: regulations.workspace.penalties,
    versions: regulations.workspace.versions,
    audit: regulations.workspace.audit,
  };
  const tabs: SegmentedItem<WorkspaceTab>[] = WORKSPACE_TABS.map(value => ({
    value,
    label: tabLabels[value],
    href: localeHref(locale, regulationHref(scope, { selectedId: scope.selectedId, tab: value })),
  }));

  return (
    <Card as="section" labelledBy="regulation-workspace">
      <CardHeader
        level="h2"
        titleId="regulation-workspace"
        title={<bdi>{regulation.title}</bdi>}
        description={<bdi>{regulation.code} · {regulation.issuing_authority ?? regulations.authorities.notRecorded}</bdi>}
        trailing={<StatusPill tone="info">{regulations.workspace.readOnly}</StatusPill>}
      />
      <CardBody>
        <Text tone="muted">{regulations.workspace.locked}</Text>
        <SegmentedControl items={tabs} value={scope.tab} label={regulations.workspace.tabLabel} />

        <div className={styles.panel}>
          {scope.tab === "overview" ? (
            <RegulationOverview
              workspace={workspace}
              statusLabel={statusLabel}
              formatDay={day}
              strings={regulations.overview}
            />
          ) : null}

          {scope.tab === "items" ? (
            workspace.items.kind === "unavailable"
              ? unreadable(regulations.workspace.items)
              : <RegulationItems items={items} labelFor={labelFor} strings={regulations.items} />
          ) : null}

          {scope.tab === "violations" ? (
            workspace.violations.kind === "unavailable"
              ? unreadable(regulations.workspace.violations)
              : <RegulationViolations violations={violations} items={items} labelFor={labelFor} strings={regulations.violations} />
          ) : null}

          {scope.tab === "penalties" ? (
            workspace.penalties.kind === "unavailable"
              ? unreadable(regulations.workspace.penalties)
              : <RegulationPenalties
                  penalties={workspace.penalties.rows}
                  violations={violations}
                  formatAmount={amount => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB").format(amount)}
                  labelFor={labelFor}
                  strings={regulations.penalties}
                />
          ) : null}

          {scope.tab === "versions" ? (
            workspace.versions.kind === "unavailable"
              ? unreadable(regulations.workspace.versions)
              : <RegulationVersions
                  versions={workspace.versions.rows}
                  currentVersionId={regulation.current_version_id ?? regulation.entity_id}
                  requestHref={requestHref}
                  formatDay={day}
                  strings={regulations.versions}
                />
          ) : null}

          {scope.tab === "audit" ? (
            workspace.auditEvents.kind === "unavailable"
              ? unreadable(regulations.workspace.audit)
              : <RegulationAudit
                  events={workspace.auditEvents.rows}
                  labelFor={labelFor}
                  formatStamp={iso => formatDateTime(iso, locale)}
                  strings={regulations.audit}
                />
          ) : null}
        </div>
      </CardBody>
      <CardFooter>
        {regulation.request_id ? (
          <Button variant="secondary" size="sm" href={requestHref(regulation.request_id)} label={regulations.workspace.viewRequest}>
            {regulations.workspace.viewRequest}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          href={localeHref(locale, `/admin/compliance-requests/new?request_type=modify&target_entity_id=${regulation.entity_id}`)}
          label={regulations.workspace.modify}
        >
          {regulations.workspace.modify}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          href={localeHref(locale, `/admin/regulations?id=${regulation.entity_id}`)}
          label={regulations.workspace.openRecord}
        >
          {regulations.workspace.openRecord}
        </Button>
      </CardFooter>
    </Card>
  );
}
