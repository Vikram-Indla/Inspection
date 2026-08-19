import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Field from "@/components/saqeel/field/field";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import { adminAuditMessages } from "@/features/admin-audit/strings";
import { AUDIT_MODES, type AuditMode, type AuditParams } from "@/features/admin-audit/types";
import type { AuditView } from "@/features/admin-audit/types";
import { compareReconstructions, completenessFor, reconstructAt } from "@/lib/audit-replay";
import type { Locale } from "@/lib/i18n";
import AuditDetailModes from "./audit-detail-modes";
import AuditRecorder from "./audit-recorder";
import AuditTimeTravel from "./audit-timetravel";
import styles from "./audit.module.css";

export default function AuditScreen({ data, params, locale }: {
  data: AuditView;
  params: AuditParams;
  locale: Locale;
}) {
  const strings = adminAuditMessages(locale);

  if (!data.authorized) {
    return (
      <ShellPageFrame breadcrumbLabel={strings.breadcrumb.label} breadcrumbs={[{ label: strings.breadcrumb.administration, href: "/admin" }, { label: strings.breadcrumb.audit }]} title={strings.title}>
        <EmptyState icon="restricted" tone="warning" title={strings.states.unauthorized} description={strings.tags.zeroDisclosure} />
      </ShellPageFrame>
    );
  }

  const atState = reconstructAt(data.events, params.at);
  const vsState = reconstructAt(data.events, params.vs);
  const comparison = compareReconstructions(vsState, atState);
  const completenessAvailable = data.ontologyLoaded && Boolean(params.caseRef) && !data.historyTruncated;
  const completeness = completenessFor(data.events, completenessAvailable ? data.expected : []);
  const hasCorrelation = data.events.some(event => event.correlationId);

  const modeItems: readonly SegmentedItem<AuditMode>[] = AUDIT_MODES.map(mode => ({
    value: mode,
    label: strings.modes[mode],
    href: `/admin/audit?view=${mode}&case=${encodeURIComponent(params.caseRef)}&q=${encodeURIComponent(params.query)}`,
  }));

  const meta = `${strings.code} · ${params.caseRef || strings.portfolio} · ${data.events.length}${completenessAvailable ? ` · ${completeness.found}/${completeness.expected}` : ""}`;

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[{ label: strings.breadcrumb.administration, href: "/admin" }, { label: strings.breadcrumb.audit }]}
      title={strings.title}
      description={meta}
      actions={
        <span className={styles.headStatus}>
          <StatusPill tone="success">{strings.terms.appendOnly}</StatusPill>
          {data.roles.length ? <StatusPill tone="info">{data.roles.join(" · ")}</StatusPill> : null}
        </span>
      }
    >
      <a className={styles.skip} href="#audit-chronology">{strings.skip}</a>
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardBody><Text tone="secondary"><Text as="strong" role="bodyStrong" tone="warning">{strings.tags.policyHeld}</Text>{` · ${strings.policy}`}</Text></CardBody>
        </Card>

        <form method="get" className={styles.filterForm}>
          <input type="hidden" name="view" value={params.mode} />
          <div className={styles.field}>
            <Field label={strings.filter.case} htmlFor="audit-case"><TextInput id="audit-case" name="case" defaultValue={params.caseRef} placeholder={strings.filter.casePlaceholder} /></Field>
          </div>
          <div className={styles.field}>
            <Field label={strings.filter.search} htmlFor="audit-q"><TextInput id="audit-q" name="q" defaultValue={params.query} placeholder={strings.filter.searchPlaceholder} /></Field>
          </div>
          <Button type="submit" variant="primary">{strings.filter.apply}</Button>
        </form>

        <SegmentedControl items={modeItems} value={params.mode} label={strings.modes.label} tone="accent" />

        <div className={styles.banners}>
          {data.partialScope ? <Card as="section" role="status"><CardBody><Text tone="secondary"><Text as="strong" role="bodyStrong">{strings.tags.partialScope}</Text>{` ${strings.banners.partial}`}</Text></CardBody></Card> : null}
          {data.semanticUnavailable ? <Card as="section" role="status"><CardBody><Text tone="warning"><Text as="strong" role="bodyStrong">{strings.tags.degraded}</Text>{` ${strings.banners.degraded}`}</Text></CardBody></Card> : null}
          {data.historyTruncated ? <Card as="section" role="status"><CardBody><Text tone="warning">{strings.banners.partialHistory}</Text></CardBody></Card> : null}
          {data.sourceError ? <Card as="section" role="alert"><CardBody><Text tone="danger">{data.sourceErrorMessage}</Text></CardBody></Card> : null}
        </div>

        {!data.sourceError && data.events.length === 0 ? (
          <EmptyState icon="search" title={strings.states.zero} />
        ) : null}

        {data.events.length > 0 && params.mode === "recorder" ? (
          <AuditRecorder events={data.events} atStateCount={atState.length} hasCorrelation={hasCorrelation} strings={strings} locale={locale} />
        ) : null}
        {params.mode === "reconstruct" || params.mode === "compare" ? (
          <AuditTimeTravel mode={params.mode} caseRef={params.caseRef} at={params.at} vs={params.vs} atState={atState} comparison={comparison} strings={strings} />
        ) : null}
        {params.mode === "ledger" || params.mode === "custody" || params.mode === "print" ? (
          <AuditDetailModes mode={params.mode} completeness={completeness} completenessAvailable={completenessAvailable} events={data.events} strings={strings} />
        ) : null}
      </div>
    </ShellPageFrame>
  );
}
