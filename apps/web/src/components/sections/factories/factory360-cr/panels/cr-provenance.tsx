import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn, CellLink } from "@/components/saqeel/data-table/data-table";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { humaniseEnum } from "@/lib/text";
import type { CrTimelineRow } from "@/features/factories/cr-dossier/queries";
import { reconciliationTone, type CrFormatters, type CrStrings } from "@/features/factories/cr-dossier/view";

type TimelineDisplay = { readonly id: string; readonly date: string; readonly title: string; readonly detail: string; readonly href: string | null };

export default function CrProvenance({ dossier, timeline, timelineFailed, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  timeline: readonly CrTimelineRow[];
  timelineFailed: boolean;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { canonical, factoryId } = dossier;
  const src = fmt.sourceState(timelineFailed, timeline, Boolean(factoryId));
  const events = strings.timeline.events as Record<string, string>;

  const rows: TimelineDisplay[] = timeline.map(event => {
    const payload = event.payload ?? {};
    const detail = Object.entries(payload)
      .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
      .map(([key, value]) => `${fmt.label(key)}: ${fmt.text(value)}`)
      .join(" · ") || `${fmt.label(event.object_type)} · ${fmt.label(event.source)}`;
    return {
      id: `${event.event_key}-${event.object_id}`,
      date: fmt.dt(event.occurred_at),
      title: events[event.event_key] ?? humaniseEnum(event.event_key, locale),
      detail,
      href: event.object_type === "inspections" ? localeHref(locale, `/reports/inspection/${event.object_id}`) : null,
    };
  });

  const timelineColumns: DataColumn<TimelineDisplay>[] = [
    { key: "date", header: strings.visits.date, numeric: true, width: "min", cell: row => row.date },
    { key: "event", header: strings.timeline.event, isRowHeader: true, cell: row => row.title },
    { key: "detail", header: strings.timeline.detail, cell: row => row.href ? <CellLink href={row.href}>{row.detail}</CellLink> : row.detail },
  ];

  const provider = (source: { provider: string }) => source.provider;
  const reconRow = (label: string, entry: { role: string; source: { provider: string } }, note?: string): Definition => ({
    label,
    value: <><StatusPill tone={reconciliationTone(entry.role)}>{fmt.label(entry.role)}</StatusPill>{` `}<Text as="span" role="label" tone="muted">{note ?? provider(entry.source)}</Text></>,
  });
  const reconItems: Definition[] = [
    reconRow(strings.xpc.cr, canonical.commercialRegistration),
    reconRow(strings.xpc.license, canonical.industrialLicense),
    reconRow(strings.xpc.plant, canonical.plant),
    reconRow(strings.xpc.activities, canonical.products, `${canonical.products.value?.length ?? 0} / ${canonical.materials.value?.length ?? 0} / ${canonical.machines.value?.length ?? 0}`),
    reconRow(strings.xpc.workforce, canonical.workforce, strings.xpc.workforceNote),
    reconRow(strings.xpc.package, canonical.approvedPackageVersion, `${fmt.text(canonical.approvedPackageVersion.value)} · ${fmt.text(canonical.immutableSubmissionVersion.value)}`),
  ];

  const counts = canonical.discrepancies.reduce<Record<string, number>>((acc, item) => { acc[item.state] = (acc[item.state] ?? 0) + 1; return acc; }, {});
  const reconTone = counts["conflicting"] ? "danger" : counts["contract_unverified"] ? "warning" : "success";
  const reconLabel = counts["conflicting"] ? strings.xpc.conflicts : counts["contract_unverified"] ? strings.xpc.unverified : strings.xpc.reconciled;
  const summary = Object.entries(counts).map(([state, count]) => `${fmt.label(state)} ${count}`).join(" · ") || strings.xpc.none;

  return (
    <>
      <Card as="section" labelledBy="f360cr-timeline">
        <CardHeader level="h2" titleId="f360cr-timeline" title={strings.timeline.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
        <CardBody>
          <Text as="p" tone="muted">{strings.timeline.rule}</Text>
          <DataTable rows={rows} columns={timelineColumns} getRowId={row => row.id} caption={strings.timeline.heading} empty={{ icon: "elapsed", title: timelineFailed ? strings.section.degraded : strings.timeline.empty }} />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-xpc">
        <CardHeader level="h2" titleId="f360cr-xpc" title={strings.xpc.heading} trailing={<StatusPill tone={reconTone}>{reconLabel}</StatusPill>} />
        <CardBody>
          <Text as="p" tone="muted">{strings.xpc.rule}</Text>
          <DefinitionList items={reconItems} columns="two" />
          <Text as="p" tone="muted">{`${strings.xpc.discrepancies}: ${summary}`}</Text>
        </CardBody>
      </Card>
    </>
  );
}
