import ContextualAiPanel from "@/components/ContextualAiPanel";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Button from "@/components/saqeel/button/button";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Metric, Mono, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { geminiProviderState } from "@/lib/providers/ai-gemini";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import CrExportButton from "./cr-export-button";
import styles from "./factory360-cr.module.css";

const riskTone = (band: string | null | undefined): StatusTone =>
  band === "high" ? "danger" : band === "medium" ? "warning" : band === "low" ? "success" : "neutral";

export default function CrContextRail({ dossier, aiProviderState, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  aiProviderState: ReturnType<typeof geminiProviderState>;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { cr, selected, factory, factoryId, permissions, riskHistory, riskResult, penalties, penaltiesResult, licenseError } = dossier;
  if (!cr) return null;
  const src = fmt.sourceState(licenseError, selected, Boolean(selected));

  const contextItems: Definition[] = [
    { label: strings.context.cr, value: <Mono>{cr.cr_number}</Mono> },
    { label: strings.context.license, value: <Mono>{fmt.text(selected?.license_number)}</Mono> },
    { label: strings.context.plant, value: <Mono>{fmt.text(selected?.plant_number)}</Mono> },
  ];
  const sourceItems: Definition[] = [
    { label: strings.source.record, value: strings.source.localCopy },
    { label: strings.source.system, value: <Mono>{fmt.text(selected?.source_system ?? cr.source_system)}</Mono> },
    { label: strings.source.timestamp, value: <Mono>{fmt.dt(selected?.source_synced_at ?? cr.source_synced_at)}</Mono> },
  ];
  const riskFacts: Definition[] = [
    { label: strings.risk.version, value: <Mono>{fmt.text(factory?.risk_version)}</Mono> },
    { label: strings.risk.calculated, value: <Mono>{fmt.dt(factory?.risk_calculated_at)}</Mono> },
  ];
  const planHref = factoryId && permissions["create_inspection"]
    ? localeHref(locale, `/planning/single?cr=${encodeURIComponent(cr.cr_number)}&license=${encodeURIComponent(selected?.license_number ?? "")}&plant=${encodeURIComponent(selected?.plant_number ?? "")}&factory=${factoryId}&source=factory360`)
    : null;

  return (
    <>
      <Card as="section" labelledBy="f360cr-context">
        <CardHeader level="h2" titleId="f360cr-context" title={strings.context.heading} />
        <CardBody><DefinitionList items={contextItems} /></CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-source">
        <CardHeader level="h2" titleId="f360cr-source" title={strings.source.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
        <CardBody>
          <DefinitionList items={sourceItems} />
          <Text as="p" tone="muted">{strings.source.noSla}</Text>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-risk">
        <CardHeader level="h2" titleId="f360cr-risk" title={strings.risk.heading} trailing={<StatusPill tone="neutral">{strings.risk.advisory}</StatusPill>} />
        <CardBody>
          {!permissions["view_risk_details"] ? (
            <EmptyState icon="restricted" title={strings.risk.restricted} size="sm" />
          ) : (
            <>
              <div className={styles.complianceHead}>
                <Metric>{fmt.text(factory?.risk_score)}</Metric>
                <StatusPill tone={riskTone(factory?.risk_band)}>{fmt.label(factory?.risk_band)}</StatusPill>
              </div>
              <Text as="p" tone="muted">{strings.risk.source}</Text>
              <DefinitionList items={riskFacts} />
              <Text as="p" tone="muted">{riskResult.error ? strings.section.degraded : fill(strings.risk.snapshots, { count: riskHistory.length })}</Text>
              {factoryId ? (
                <details className={styles.subgroup}>
                  <summary><Text as="span" role="label">{strings.risk.aiDisclosure}</Text></summary>
                  <ContextualAiPanel
                    surface="factory_risk_explanation"
                    title={strings.risk.aiTitle}
                    description={strings.risk.aiDescription}
                    context={JSON.stringify({ factory_id: factoryId })}
                    evidenceRefs={["MVP1-M07-014", "MVP1-M07-015", "F360-AC-004", factory?.risk_version ?? "risk_version_unavailable"]}
                    targetRef={factoryId}
                    locale={locale === "ar" ? "ar" : "en"}
                    generateLabel={strings.risk.aiGenerate}
                    unavailableLabel={strings.risk.aiUnavailable}
                    evidenceLabel={strings.risk.aiEvidence}
                    advisoryLabel={strings.risk.aiAdvisory}
                    providerState={aiProviderState}
                  />
                </details>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-penalties">
        <CardHeader level="h2" titleId="f360cr-penalties" title={strings.enforcement.heading} />
        <CardBody>
          {penaltiesResult.error ? (
            <EmptyState icon="enforcement" tone="warning" title={strings.section.degraded} size="sm" />
          ) : penalties.length ? (
            <ul className={styles.evidenceList}>
              {penalties.map(row => (
                <li className={styles.evidenceItem} key={row.id}>
                  <Mono>{row.notice_number}</Mono>
                  <Text as="span" role="label" tone="muted">{`${fmt.label(row.status)} · ${fmt.dt(row.issued_at)}`}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="enforcement" title={strings.enforcement.empty} size="sm" />
          )}
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-actions">
        <CardHeader level="h2" titleId="f360cr-actions" title={strings.actions.heading} />
        {factoryId || planHref || permissions["export_factory"] ? (
          <CardFooter align="start">
            {factoryId ? <Button variant="secondary" icon="map" href={localeHref(locale, `/factories/${factoryId}?compat=legacy#location`)} label={strings.actions.openMap}>{strings.actions.openMap}</Button> : null}
            {planHref ? <Button variant="secondary" icon="create" href={planHref} label={strings.actions.planSingle}>{strings.actions.planSingle}</Button> : null}
            {permissions["export_factory"] ? <CrExportButton label={strings.actions.exportPdf} /> : null}
          </CardFooter>
        ) : (
          <CardBody><EmptyState icon="restricted" title={strings.actions.restricted} size="sm" /></CardBody>
        )}
      </Card>
    </>
  );
}
