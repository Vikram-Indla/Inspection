import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { titleCase } from "@/features/factories/portfolio";
import { PAST_DATE_RANGE_PRESETS } from "@/components/saqeel/date-range-picker/date-range-presets";
import { enforcementExportHref, enforcementHref, type EnforcementScope } from "@/features/enforcement/params";
import { queryEnforcementLibrary } from "@/features/enforcement/queries";
import {
  filterEnforcement, regionsOf, statusesOf, toEnforcementRow, type PenaltyState,
} from "@/features/enforcement/rows";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./enforcement-screen.module.css";
import EnforcementFilterBar from "../enforcement-filter-bar/enforcement-filter-bar";
import EnforcementRecord from "../enforcement-record/enforcement-record";
import EnforcementTable from "../enforcement-table/enforcement-table";

export default async function EnforcementScreen({ locale, scope, nowMs }: {
  locale: Locale;
  scope: EnforcementScope;
  nowMs: number;
}) {
  const { common, enforcement } = getMessages(locale);
  const library = await queryEnforcementLibrary();
  const label = (value: string) => enforcement.enum[value as keyof typeof enforcement.enum] ?? titleCase(value);

  if (library.kind === "unauthenticated") {
    return <Notice title={enforcement.access.title} body={enforcement.access.body} tone="danger" />;
  }
  if (library.kind === "unavailable") {
    return <Notice title={enforcement.degraded.title} body={enforcement.degraded.body} tone="danger" />;
  }

  const all = library.violations.map(row => toEnforcementRow(row, library.penalties, library.penaltiesReadable));
  const rows = filterEnforcement(all, scope, nowMs);
  const filtered = Boolean(scope.search || scope.status || scope.range || scope.region);
  const href = (overrides: Parameters<typeof enforcementHref>[1]) => localeHref(locale, enforcementHref(scope, overrides));
  const day = (iso: string) => formatDate(iso, locale);
  const amount = (value: number) => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB").format(value);

  const selected = scope.violationId ? all.find(row => row.id === scope.violationId) ?? null : null;
  const selectedSource = selected ? library.violations.find(row => row.id === selected.id) ?? null : null;

  const penaltyLine = (state: PenaltyState) => {
    if (state.kind === "restricted") return enforcement.table.penaltyRestricted;
    if (state.kind === "none") return enforcement.table.penaltyNone;
    if (state.kind === "multiple") return fill(enforcement.table.penaltyMultiple, { count: state.count });
    const name = state.snapshot.penaltyType ? label(state.snapshot.penaltyType) : state.snapshot.penaltyRef ?? "";
    const money = state.snapshot.amount === null ? "" : ` — ${fill(enforcement.table.amount, { amount: amount(state.snapshot.amount) })}`;
    const issued = state.issued
      ? state.issuedAt ? `${enforcement.table.penaltyIssued} · ${day(state.issuedAt)}` : enforcement.table.penaltyIssued
      : enforcement.table.penaltyInformational;
    return `${name}${money} · ${issued}`;
  };

  return (
    <div className={styles.stack}>
      <Card as="section" labelledBy="enforcement-policy">
        <CardHeader
          level="h2"
          titleId="enforcement-policy"
          title={enforcement.policy.title}
          trailing={<StatusPill tone="info">{enforcement.policy.readOnly}</StatusPill>}
        />
        <CardBody>
          <Text tone="secondary">{enforcement.policy.body}</Text>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="enforcement-records">
        <CardHeader
          level="h2"
          titleId="enforcement-records"
          title={enforcement.title}
          description={fill(enforcement.records.count, { shown: rows.length, total: all.length })}
        />
        <CardBody>
          <EnforcementFilterBar
            action={localeHref(locale, scope.routeBase)}
            search={scope.search}
            status={scope.status}
            range={scope.range}
            region={scope.region}
            statusOptions={[
              { value: "", label: enforcement.filters.anyStatus },
              ...statusesOf(all).map(value => ({ value, label: label(value) })),
            ]}
            rangeOptions={[
              { value: "", label: enforcement.filters.anyDate },
              ...PAST_DATE_RANGE_PRESETS.map(preset => ({
                value: String(preset.days),
                label: common.scope[preset.labelKey],
              })),
            ]}
            regionOptions={[
              { value: "", label: common.scope.allRegions },
              ...regionsOf(all).map(value => ({ value, label: value })),
            ]}
            filtered={filtered}
            clearHref={localeHref(locale, scope.routeBase)}
            exportHref={localeHref(locale, enforcementExportHref(scope))}
            strings={enforcement.filters}
          />
          <EnforcementTable
            rows={rows}
            selectedId={scope.violationId}
            hrefFor={row => href({ violationId: row.id })}
            formatDay={day}
            formatAmount={amount}
            labelFor={label}
            strings={{
              ...enforcement.table,
              emptyTitle: all.length ? enforcement.empty.filteredTitle : enforcement.empty.title,
              emptyBody: all.length ? enforcement.empty.filteredBody : enforcement.empty.body,
            }}
          />
        </CardBody>
      </Card>

      {scope.violationId && !selected ? (
        <Notice title={enforcement.missing.title} body={enforcement.missing.body} tone="warning" />
      ) : null}

      {selected && selectedSource ? (
        <EnforcementRecord
          row={selected}
          source={selectedSource}
          penaltyLine={penaltyLine(selected.penalty)}
          closeHref={href({ violationId: "" })}
          factoryHref={selected.factory ? localeHref(locale, `/factories/${selected.factory.id}`) : null}
          formatDay={day}
          labelFor={label}
          strings={enforcement.record}
        />
      ) : null}
    </div>
  );
}

function Notice({ title, body, tone }: { title: string; body: string; tone: "danger" | "warning" }) {
  return (
    <Card as="section" labelledBy="enforcement-notice">
      <CardHeader level="h2" titleId="enforcement-notice" title={title} />
      <CardBody>
        <EmptyState tone={tone} title={body} size="sm" />
      </CardBody>
    </Card>
  );
}
