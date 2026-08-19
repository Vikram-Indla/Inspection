import { decideComplianceRequestComponent } from "@/app/(app)/admin/compliance-requests/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Mono, Overline, Text } from "@/components/saqeel/type";
import { statusTone, type Component } from "@/features/admin-compliance-requests/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import ActionForm from "./action-form";
import styles from "./compliance-requests.module.css";

type Copy = Messages["adminComplianceRequests"];

function snapshotTitle(component: Component): string {
  const snapshot = component.proposed_value_snapshot;
  return String(snapshot.title ?? snapshot.code ?? component.id.slice(0, 8));
}

function asJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export default function ComponentCard({ component, index, requestId, reviewable, parentLabels, publicationVersion, publishedAt, kindLabel, statusLabel, copy, locale }: {
  component: Component;
  index: number;
  requestId: string;
  reviewable: boolean;
  parentLabels: readonly string[];
  publicationVersion: string | null;
  publishedAt: string | null;
  kindLabel: (value: string) => string;
  statusLabel: (value: string) => string;
  copy: Copy;
  locale: "en" | "ar";
}) {
  const cc = copy.components;

  return (
    <Card as="article" role="group">
      <CardBody>
        <div className={styles.componentHead}>
          <span className={styles.componentIdentity}>
            <Overline as="p">{`${index + 1} · ${kindLabel(component.entity_kind)}`}</Overline>
            <Heading level={4} visual="bodyStrong">{snapshotTitle(component)}</Heading>
          </span>
          <StatusPill tone={statusTone(component.component_status)} ping={false}>{statusLabel(component.component_status)}</StatusPill>
        </div>

        {component.target_entity_id ? (
          <Text role="label" tone="secondary">{`${cc.targetExisting}: `}<bdi><Mono>{component.target_entity_id}</Mono></bdi></Text>
        ) : (
          <Text role="label" tone="muted">{cc.targetNew}</Text>
        )}
        {parentLabels.length ? (
          <Text role="label" tone="secondary" dir="auto">{`${cc.dependsOn}: ${parentLabels.join(" · ")}`}</Text>
        ) : null}

        <div className={styles.compare}>
          <div className={styles.compareCol}>
            <Text role="label" tone="muted">{cc.currentValue}</Text>
            <div className={styles.json}><Mono>{asJson(component.current_value_snapshot)}</Mono></div>
          </div>
          <div className={styles.compareCol}>
            <Text role="label" tone="muted">{cc.proposedValue}</Text>
            <div className={styles.json}><Mono>{asJson(component.proposed_value_snapshot)}</Mono></div>
          </div>
        </div>

        {component.component_comments ? (
          <Text role="label" tone="secondary" dir="auto">{`${cc.makerComment}: ${component.component_comments}`}</Text>
        ) : null}
        {component.decision_comments ? (
          <Text role="label" tone="secondary" dir="auto">{`${cc.decision}: ${component.decision_comments}`}</Text>
        ) : null}
        {publicationVersion && publishedAt ? (
          <Text role="label" tone="success">{fill(cc.publishedAt, { version: publicationVersion, date: formatDateTime(publishedAt, locale) })}</Text>
        ) : null}

        {reviewable && component.component_status === "pending_review" ? (
          <ActionForm action={decideComplianceRequestComponent} className={styles.decideForm}>
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="component_id" value={component.id} />
            <Field label={cc.decisionComment} htmlFor={`decide-${component.id}`}>
              <TextInput id={`decide-${component.id}`} name="comments" placeholder={cc.decisionCommentPlaceholder} />
            </Field>
            <div className={styles.decideActions}>
              <Button type="submit" name="decision" value="approve" variant="primary" size="sm">{cc.approve}</Button>
              <Button type="submit" name="decision" value="reject" variant="danger" size="sm">{cc.reject}</Button>
            </div>
          </ActionForm>
        ) : null}
      </CardBody>
    </Card>
  );
}
