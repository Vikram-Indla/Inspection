import { type ReactNode } from "react";
import { updateComplianceRequestDraft } from "@/app/(app)/admin/compliance-requests/actions";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Textarea from "@/components/saqeel/textarea/textarea";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { ComplianceRequestDetail } from "@/features/admin-compliance-requests/queries";
import { statusTone } from "@/features/admin-compliance-requests/types";
import { fill, getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import ActionForm from "./action-form";
import ActionZone from "./action-zone";
import AddComponentForm from "./add-component-form";
import ComponentCard from "./component-card";
import DecisionsTable from "./decisions-table";
import DependenciesPanel from "./dependencies-panel";
import WorkspaceTabs, { type WorkspaceTabValue } from "./workspace-tabs";
import styles from "./compliance-requests.module.css";

export default function RequestWorkspace({ detail, locale, fromQueue }: {
  detail: ComplianceRequestDetail;
  locale: Locale;
  fromQueue: boolean;
}) {
  const copy = getMessages(locale).adminComplianceRequests;
  const lang = locale === "ar" ? "ar" : "en";
  const w = copy.workspace;
  const { request } = detail;

  const kindLabel = (value: string): string => copy.kinds[value as keyof typeof copy.kinds] ?? humaniseEnum(value, lang);
  const statusLabel = (value: string): string => copy.status[value as keyof typeof copy.status] ?? humaniseEnum(value, lang);

  const currentComponents = detail.components.filter(component => component.revision_number === request.current_revision);
  const currentDependencies = detail.dependencies.filter(dependency => dependency.revision_number === request.current_revision);
  const byId = new Map(currentComponents.map(component => [component.id, component]));
  const compLabel = (id: string): string => {
    const component = byId.get(id);
    return component ? `${kindLabel(component.entity_kind)} · ${String(component.proposed_value_snapshot.code ?? id.slice(0, 8))}` : id.slice(0, 8);
  };
  const canRevise = detail.isOwner && detail.canWrite && request.status === "returned";

  const facts = [
    { label: w.factType, value: kindLabel(request.request_type) },
    { label: w.factOwner, value: <span><bdi><Mono>{request.owner_id}</Mono></bdi>{detail.isOwner ? ` · ${copy.common.you}` : ""}</span> },
    { label: w.factCreated, value: formatDateTime(request.created_at, lang) },
    { label: w.factSubmitted, value: request.submitted_at ? formatDateTime(request.submitted_at, lang) : w.notSubmitted },
    { label: w.factRevision, value: fill(copy.common.revisionShort, { n: request.current_revision }) },
    { label: w.factPublication, value: request.publication_audit_reference ?? w.notPublished },
  ];

  const historyPanel = (
    <ol className={styles.history}>
      {detail.revisions.map(revision => (
        <li key={revision.id} className={styles.historyRow}>
          <Text role="label" as="span">{fill(copy.common.revision, { n: revision.revision_number })}</Text>
          <Text role="label" tone="secondary" as="span">{revision.submitted_at ? fill(copy.history.submittedAt, { date: formatDateTime(revision.submitted_at, lang) }) : copy.history.draft}</Text>
          <Text role="label" tone="muted" as="span">{fill(copy.history.counts, {
            components: detail.components.filter(component => component.revision_number === revision.revision_number).length,
            decisions: detail.decisions.filter(decision => decision.revision_number === revision.revision_number).length,
          })}</Text>
        </li>
      ))}
    </ol>
  );

  const panels: Readonly<Record<WorkspaceTabValue, ReactNode>> = {
    dependencies: <DependenciesPanel requestId={request.id} dependencies={currentDependencies} components={currentComponents} editable={detail.editable} labelForComponent={compLabel} copy={copy} />,
    history: historyPanel,
    decisions: <DecisionsTable decisions={detail.decisions} copy={copy} locale={lang} />,
  };

  return (
    <ShellPageFrame
      breadcrumbLabel={request.request_number}
      breadcrumbs={[
        { label: copy.breadcrumb.administration, href: "/admin" },
        { label: fromQueue ? w.backQueue : w.backList, href: fromQueue ? "/admin/compliance-approvals" : "/admin/compliance-requests" },
        { label: request.request_number },
      ]}
      title={`${request.request_number} — ${request.title}`}
      actions={<StatusPill tone={statusTone(request.status)} ping={false}>{`${statusLabel(request.status)} · ${fill(copy.common.revisionShort, { n: request.current_revision })}`}</StatusPill>}
    >
      <div className={styles.stack}>
        {request.return_reason ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={w.returnReason} trailing={<StatusPill tone="warning">{statusLabel(request.status)}</StatusPill>} />
            <CardBody><Text tone="secondary" dir="auto">{request.return_reason}</Text></CardBody>
          </Card>
        ) : null}
        {!detail.isOwner && !detail.canReview ? (
          <Card as="section" role="note">
            <CardHeader level="h2" title={w.readOnlyTitle} />
            <CardBody><Text tone="secondary">{w.readOnlyBody}</Text></CardBody>
          </Card>
        ) : null}

        <Card as="section">
          <CardHeader level="h2" title={w.summaryHeading} />
          <CardBody gap="loose">
            <Text tone="secondary" dir="auto">{request.description || w.noDescription}</Text>
            <DefinitionList items={facts} columns="two" />
          </CardBody>
        </Card>

        {detail.editable ? (
          <Card as="section">
            <CardHeader level="h2" title={w.draftHeading} />
            <CardBody>
              <ActionForm action={updateComplianceRequestDraft} className={styles.form} savedLabel={w.saved}>
                <input type="hidden" name="request_id" value={request.id} />
                <Field label={w.draftTitle} htmlFor="ccr-draft-title">
                  <TextInput id="ccr-draft-title" name="title" required defaultValue={request.title} placeholder={w.draftTitle} />
                </Field>
                <Field label={w.draftDescription} htmlFor="ccr-draft-desc">
                  <Textarea id="ccr-draft-desc" name="description" rows={3} defaultValue={request.description ?? ""} placeholder={w.draftDescription} />
                </Field>
                <Field label={w.draftComments} htmlFor="ccr-draft-comments">
                  <Textarea id="ccr-draft-comments" name="comments" rows={2} defaultValue={request.comments ?? ""} placeholder={w.draftComments} />
                </Field>
                <div className={styles.footer}><Button type="submit" variant="secondary" size="sm">{w.saveDraft}</Button></div>
              </ActionForm>
            </CardBody>
          </Card>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Heading level={2} visual="label">{copy.components.heading}</Heading>
            <StatusPill tone="neutral" ping={false}>{fill(copy.components.countInRevision, { n: currentComponents.length, r: request.current_revision })}</StatusPill>
          </div>
          <Text tone="muted">{copy.components.immutableNote}</Text>
          {currentComponents.length === 0 ? (
            <Card as="section"><CardHeader title={copy.components.emptyTitle} description={copy.components.emptyBody} /></Card>
          ) : (
            currentComponents.map((component, index) => {
              const parentLabels = currentDependencies.filter(dependency => dependency.child_component_id === component.id).map(dependency => compLabel(dependency.parent_component_id));
              const publication = detail.publications.find(item => item.component_id === component.id);
              return (
                <div id={`component-${component.id}`} key={component.id}>
                  <ComponentCard component={component} index={index} requestId={request.id} reviewable={detail.reviewable}
                    parentLabels={parentLabels} publicationVersion={publication?.version_id ?? null} publishedAt={publication?.published_at ?? null}
                    kindLabel={kindLabel} statusLabel={statusLabel} copy={copy} locale={lang} />
                </div>
              );
            })
          )}
          {detail.editable ? <AddComponentForm requestId={request.id} isModify={request.request_type === "modify"} copy={copy} /> : null}
        </section>

        <WorkspaceTabs
          label={copy.components.heading}
          tabs={[
            { value: "dependencies", label: copy.dependencies.heading, count: currentDependencies.length },
            { value: "history", label: copy.history.heading, count: detail.revisions.length },
            { value: "decisions", label: copy.decisions.heading, count: detail.decisions.length },
          ]}
          panels={panels}
        />

        <ActionZone request={request} editable={detail.editable} reviewable={detail.reviewable} publishable={detail.publishable} canRevise={canRevise} copy={copy} />
      </div>
    </ShellPageFrame>
  );
}
