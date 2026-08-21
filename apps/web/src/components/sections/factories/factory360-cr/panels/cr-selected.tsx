import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { SelectOption } from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { CrVisitRow } from "@/features/factories/cr-dossier/queries";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import CrVisits, { type CrVisitDisplay } from "../cr-visits";

const addressParts = (address: Record<string, string | number | null> | null, keys: readonly string[]) =>
  address ? keys.map(key => address[key]).filter(Boolean).join(" · ") : "";

const distinct = (values: readonly string[]) => [...new Set(values)].sort();

export default function CrSelected({ dossier, visits, visitsFailed, fmt, strings }: {
  dossier: Factory360Dossier;
  visits: readonly CrVisitRow[];
  visitsFailed: boolean;
  fmt: CrFormatters;
  strings: CrStrings;
}) {
  const { selected, factory, address, exportsProducts, addressResult } = dossier;
  const src = fmt.sourceState(addressResult.error, address, Boolean(selected));
  const addressAr = addressParts(address, ["address_line_1", "street_name_ar", "city_ar", "region_ar"]);
  const addressEn = addressParts(address, ["street_name_en", "city_en", "region_en"]);
  const exports = exportsProducts === null
    ? strings.license.exportsUnknown
    : exportsProducts ? strings.license.exportsYes : strings.license.exportsNo;

  const facts: Definition[] = selected && factory ? [
    { label: strings.license.number, value: <Mono>{selected.license_number}</Mono> },
    { label: strings.fields.plant, value: <Mono>{fmt.text(selected.plant_number)}</Mono> },
    { label: strings.license.factory, value: <>{factory.name}{` · `}<Mono>{factory.factory_code}</Mono></> },
    { label: strings.license.statusStage, value: `${fmt.label(selected.status)} · ${fmt.label(selected.stage)}` },
    { label: strings.license.dates, value: <Mono>{`${fmt.dt(selected.issue_date)} → ${fmt.dt(selected.expiry_date)}`}</Mono> },
    { label: strings.license.holder, value: fmt.text(selected.holder_name) },
    {
      label: strings.license.address,
      value: addressAr || addressEn
        ? <>{addressAr ? <Text as="span" dir="rtl">{addressAr}</Text> : null}{addressAr && addressEn ? <br /> : null}{addressEn ? <Text as="span" dir="ltr">{addressEn}</Text> : null}</>
        : "—",
    },
    { label: strings.license.coordinates, value: <Mono>{address ? `${fmt.text(address.latitude)}, ${fmt.text(address.longitude)}` : "—"}</Mono> },
    { label: strings.license.exports, value: exports },
  ] : [];

  const visitRows: CrVisitDisplay[] = visits.map(row => ({
    id: row.id,
    reference: row.id.slice(0, 8),
    date: fmt.dt(row.window_start),
    type: row.visit_type,
    typeLabel: fmt.label(row.visit_type),
    planningStatus: row.planning_status,
    planningLabel: fmt.label(row.planning_status),
    operationalLabel: fmt.label(row.operational_state),
    locationSourceLabel: fmt.label(row.visit_location_source),
    coords: row.planner_lat === null || row.planner_lng === null ? "—" : `${row.planner_lat}, ${row.planner_lng}`,
  }));
  const statusOptions: SelectOption[] = [{ value: "", label: strings.visits.all }, ...distinct(visits.map(row => row.planning_status)).map(value => ({ value, label: fmt.label(value) }))];
  const typeOptions: SelectOption[] = [{ value: "", label: strings.visits.all }, ...distinct(visits.map(row => row.visit_type)).map(value => ({ value, label: fmt.label(value) }))];

  return (
    <Card as="section" labelledBy="f360cr-license">
      <CardHeader level="h2" titleId="f360cr-license" title={strings.license.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
      <CardBody>
        {facts.length ? <DefinitionList items={facts} columns="two" /> : <Text as="p" tone="muted">{strings.license.unavailable}</Text>}
        <Heading level={3}>{strings.visits.heading}</Heading>
        <Text as="p" tone="muted">{strings.visits.boundary}</Text>
        {visitsFailed
          ? <EmptyState icon="visits" tone="warning" title={strings.section.degraded} size="sm" />
          : visits.length
            ? <CrVisits rows={visitRows} statusOptions={statusOptions} typeOptions={typeOptions} strings={strings.visits} />
            : <EmptyState icon="visits" title={strings.visits.empty} size="sm" />}
      </CardBody>
    </Card>
  );
}
