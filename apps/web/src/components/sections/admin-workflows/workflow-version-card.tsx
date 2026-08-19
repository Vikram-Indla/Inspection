import { NotYetBoundary } from "@/components/NotYetBoundary";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { versionStatusLabel, versionStatusTone, type AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { WorkflowVersion } from "@/features/admin-workflows/types";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import WfDeck from "./wf-deck";
import { WfEditorForm, WfProposeForm, WfPublishForm } from "./wf-forms";
import styles from "./workflows.module.css";

export default function WorkflowVersionCard({ version, strings, locale }: {
  version: WorkflowVersion;
  strings: AdminWorkflowsMessages;
  locale: Locale;
}) {
  return (
    <Card as="article">
      <CardHeader
        level="h3"
        title={<span className={styles.stateRow}>{`${strings.object}: ${version.object ?? strings.deck.none}`} <Mono>{version.version_label}</Mono></span>}
        trailing={
          <span className={styles.headActions}>
            <StatusPill tone={versionStatusTone(version.status)}>{versionStatusLabel(version.status, strings, locale)}</StatusPill>
            {version.status === "draft" && !version.isOwnDraft ? <WfPublishForm versionId={version.id} strings={strings} /> : null}
            {version.isOwnDraft ? (
              <span className={styles.stateRow} title={strings.sod.desc}>
                <Icon name="restricted" size="sm" />
                <StatusPill tone="warning">{strings.sod.title}</StatusPill>
              </span>
            ) : null}
          </span>
        }
      />
      <CardBody>
        <Text tone="secondary">
          {strings.chain.proposed} <Text as="strong" role="bodyStrong">{version.proposedByName ?? strings.chain.unknownUser}</Text>
          {version.created_at ? <> · <Text as="span" role="mono" dir="ltr">{formatDateTime(version.created_at, locale)}</Text></> : null}
          {" → "}
          {version.approvedByName
            ? <>{strings.chain.approved} <Text as="strong" role="bodyStrong">{version.approvedByName}</Text> <StatusPill tone="success">{strings.chain.distinct}</StatusPill></>
            : <>{strings.chain.pending}</>}
        </Text>

        <WfDeck payload={version.payload} strings={strings} locale={locale} />

        {version.status === "draft" ? (
          <>
            <WfEditorForm versionId={version.id} payload={version.payload} strings={strings} />
            <NotYetBoundary
              title={strings.sim.title}
              consequence={strings.sim.desc}
              seam={strings.notConfigured}
              prerequisites={[strings.sim.pre1, strings.sim.pre2]}
              notAvailableLabel={strings.sim.notYet}
              detailLabel={strings.sim.whyPrereq}
            />
          </>
        ) : null}

        {version.status === "published" ? (
          <WfProposeForm baseVersionId={version.id} baseLabel={version.version_label} strings={strings} />
        ) : null}
      </CardBody>
    </Card>
  );
}
