"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import type { ImmediateFactory, VisitTypeOption } from "@/features/planning-immediate/types";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const HEADING_ID = "immediate-identity";
const SEARCH_ID = "imm-search";
const FACTORY_ID = "imm-existing";
const VISIT_TYPE_ID = "imm-visit-type";

export type IdentitySelection = {
  readonly query: string;
  readonly factory: ImmediateFactory | null;
  readonly visitType: string;
};

export default function IdentitySection({
  selection, matches, visitTypes, messages, locale, onQueryChange, onFactoryChange, onVisitTypeChange,
}: {
  selection: IdentitySelection;
  matches: readonly ImmediateFactory[];
  visitTypes: readonly VisitTypeOption[];
  messages: ImmediateMessages;
  locale: Locale;
  onQueryChange: (query: string) => void;
  onFactoryChange: (factoryId: string) => void;
  onVisitTypeChange: (visitType: string) => void;
}) {
  const { identity } = messages;
  const { factory } = selection;
  const searched = selection.query.trim().length >= 2;
  const factoryOptions = matches.map(match => ({
    value: match.id,
    label: `${match.name} · ${match.cr_number}${match.license_number ? ` · ${match.license_number}` : ""}`,
  }));

  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardHeader level="h2" titleId={HEADING_ID} title={identity.heading} />
      <CardBody>
        <PlanningNotice tone="warning">
          <strong>{identity.r05Title}</strong> {identity.r05Body}
        </PlanningNotice>

        <Field label={identity.searchLabel} htmlFor={SEARCH_ID}>
          <TextInput
            id={SEARCH_ID}
            type="search"
            value={selection.query}
            placeholder={identity.searchPlaceholder}
            onChange={onQueryChange}
          />
        </Field>

        {searched && matches.length === 0 ? (
          <PlanningNotice tone="warning">{identity.searchNoMatch}</PlanningNotice>
        ) : null}

        <Field label={identity.existingFactory} htmlFor={FACTORY_ID}>
          <SaqeelSelect
            id={FACTORY_ID}
            label={identity.existingFactory}
            options={factoryOptions}
            value={factory?.id ?? ""}
            placeholder={identity.selectOption}
            onChange={onFactoryChange}
          />
        </Field>

        {factory ? (
          <Card as="article">
            <CardHeader
              level="h3"
              title={<bdi>{factory.name}</bdi>}
              trailing={
                <StatusPill tone="neutral">
                  {identity.previewRisk}: {factory.risk_band ?? identity.previewRiskUnknown}
                  {factory.risk_score === null ? "" : ` (${factory.risk_score})`}
                </StatusPill>
              }
            />
            <CardBody gap="tight">
              <DefinitionList
                columns="two"
                items={[
                  { label: identity.previewCr, value: <bdi>{factory.cr_number}</bdi> },
                  { label: identity.previewLicense, value: <bdi>{factory.license_number ?? identity.previewRiskUnknown}</bdi> },
                  {
                    label: identity.previewRegion,
                    value: <bdi>{[factory.region, factory.city].filter(Boolean).join(", ")}</bdi>,
                  },
                  {
                    label: identity.previewFreshness,
                    value: factory.source_synced_at
                      ? <bdi>{formatDate(factory.source_synced_at, locale)}</bdi>
                      : identity.previewFreshnessNever,
                  },
                ]}
              />
            </CardBody>
          </Card>
        ) : null}

        <Field label={identity.visitType} htmlFor={VISIT_TYPE_ID}>
          <SaqeelSelect
            id={VISIT_TYPE_ID}
            label={identity.visitType}
            options={visitTypes.map(type => ({ value: type.key, label: type.label }))}
            value={selection.visitType}
            onChange={onVisitTypeChange}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
