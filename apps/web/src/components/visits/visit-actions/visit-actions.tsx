"use client";

import { useActionState, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import {
  cancelVisit, duplicateVisit, reassignVisit, repackageVisit, republishVisit,
  rescheduleVisit, returnVisit, updateVisitType, type ActionResult,
} from "@/app/(app)/visits/[id]/actions";
import type { ChoiceOption } from "@/features/visits/detail/view";
import type { Locale } from "@/lib/i18n";
import CancelForm from "./cancel-form";
import DuplicateForm from "./duplicate-form";
import ReassignForm, { type Inspector } from "./reassign-form";
import RepackageForm from "./repackage-form";
import RepublishForm from "./republish-form";
import RescheduleForm from "./reschedule-form";
import ReturnForm from "./return-form";
import VisitTypeForm from "./visit-type-form";
import type { VisitActionsStrings } from "./visit-actions-strings";
import { mintIdentityPerTransition } from "./visit-actions-strings";
import styles from "./visit-actions.module.css";

export type VisitActionsProps = {
  visitId: string;
  planningVersion: number;
  status: string;
  opState: string;
  opStateLabel: string;
  visitType: string;
  windowStart: string;
  windowEnd: string;
  locale: Locale;
  inspectors: readonly Inspector[];
  canManage: boolean;
  canReassign: boolean;
  isFinal: boolean;
  returnReasons: readonly ChoiceOption[];
  packageOptions: readonly ChoiceOption[];
  visitTypes: readonly ChoiceOption[];
  cutoffDisplay: string;
  strings: VisitActionsStrings;
};

export default function VisitActions(props: VisitActionsProps) {
  const { visitId, planningVersion, status, opState, opStateLabel, isFinal, strings } = props;
  const [ret, retAct, p1] = useActionState<ActionResult, FormData>(returnVisit, {});
  const [rep, repAct, p2] = useActionState<ActionResult, FormData>(republishVisit, {});
  const [can, canAct, p3] = useActionState<ActionResult, FormData>(cancelVisit, {});
  const [rsc, rscAct, p4] = useActionState<ActionResult, FormData>(rescheduleVisit, {});
  const [rea, reaAct, p5] = useActionState<ActionResult, FormData>(reassignVisit, {});
  const [vt, vtAct, p6] = useActionState<ActionResult, FormData>(updateVisitType, {});
  const [dup, dupAct, p7] = useActionState<ActionResult, FormData>(duplicateVisit, {});
  const [pkg, pkgAct, p8] = useActionState<ActionResult, FormData>(repackageVisit, {});
  const [identity] = useState(mintIdentityPerTransition);

  const msg = ret.error ?? rep.error ?? can.error ?? rsc.error ?? rea.error ?? vt.error ?? dup.error ?? pkg.error;
  const ok = ret.ok ?? rep.ok ?? can.ok ?? rsc.ok ?? rea.ok ?? vt.ok ?? dup.ok ?? pkg.ok;
  const busy = p1 || p2 || p3 || p4 || p5 || p6 || p7 || p8;

  const scheduleBlocked = status === "published" && opState !== "new";
  const reassignBlocked = ["published", "returned"].includes(status) && !props.canReassign;
  const canManageReturned = status === "returned" && opState === "new";
  const manages = props.canManage || canManageReturned;
  const hasAvailable = status === "published" || status === "returned" || isFinal;
  const shared = { visitId, planningVersion, busy };

  return (
    <Card as="section" labelledBy="visit-management-actions">
      <CardHeader level="h2" titleId="visit-management-actions" title={strings.heading} description={strings.hint} />
      <CardBody gap="tight">
        {manages && (
          <Text as="p" role="label" tone="secondary">
            <strong>{strings.cutoffTitle}</strong>{" "}
            {strings.cutoffBody.replace("{cutoff}", props.cutoffDisplay)}
          </Text>
        )}

        <section className={styles.zone} aria-labelledby="visit-actions-available">
          <Heading level={3} visual="bodyStrong" id="visit-actions-available">{strings.zoneAvailable}</Heading>

          {status === "published" && (
            <ReturnForm {...shared} identity={identity.return} action={retAct} reasons={props.returnReasons} strings={strings.returnForm} />
          )}
          {status === "returned" && (
            <RepublishForm {...shared} identity={identity.republish} action={repAct} submitLabel={strings.republishBtn} />
          )}
          {props.canReassign && (
            <ReassignForm visitId={visitId} busy={busy} identity={identity.reassign} action={reaAct} inspectors={props.inspectors} strings={strings.reassignForm} />
          )}
          {props.canManage && (
            <VisitTypeForm {...shared} identity={identity.metadata} action={vtAct} visitType={props.visitType} types={props.visitTypes} strings={strings.visitTypeForm} />
          )}
          {manages && (
            <>
              <RescheduleForm
                {...shared}
                identity={identity.reschedule}
                action={rscAct}
                windowStart={props.windowStart}
                windowEnd={props.windowEnd}
                locale={props.locale}
                strings={strings.rescheduleForm}
              />
              <CancelForm {...shared} identity={identity.cancel} action={canAct} strings={strings.cancelForm} />
            </>
          )}
          {canManageReturned && props.packageOptions.length > 0 && (
            <RepackageForm {...shared} identity={identity.repackage} action={pkgAct} packages={props.packageOptions} strings={strings.repackageForm} />
          )}
          {isFinal && (
            <DuplicateForm {...shared} identity={identity.duplicate} action={dupAct} submitLabel={strings.duplicateBtn} draft={dup} />
          )}
          {!hasAvailable && <Text as="p" role="label" tone="muted">{strings.noneAvailable}</Text>}
        </section>

        {(scheduleBlocked || reassignBlocked) && (
          <section className={styles.zone} aria-labelledby="visit-actions-blocked">
            <Heading level={3} visual="bodyStrong" id="visit-actions-blocked">{strings.zoneBlocked}</Heading>
            {scheduleBlocked && (
              <div className={styles.blocked}>
                <StatusPill tone="warning" ping={false}>{strings.scheduleLockedActions}</StatusPill>
                <Text as="p" role="label" tone="secondary">{strings.scheduleLockedWhy.replace("{state}", opStateLabel)}</Text>
              </div>
            )}
            {reassignBlocked && (
              <div className={styles.blocked}>
                <StatusPill tone="warning" ping={false}>{strings.reassignForm.submit}</StatusPill>
                <Text as="p" role="label" tone="secondary">{strings.reassignLockedWhy.replace("{state}", opStateLabel)}</Text>
              </div>
            )}
          </section>
        )}

        {isFinal && (
          <section className={styles.zone} aria-labelledby="visit-actions-unavailable">
            <Heading level={3} visual="bodyStrong" id="visit-actions-unavailable">{strings.zoneUnavailable}</Heading>
            <div className={styles.blocked}>
              <StatusPill tone="neutral" ping={false}>{strings.finalState}</StatusPill>
              <Text as="p" role="label" tone="secondary">{strings.duplicateWhy}</Text>
            </div>
          </section>
        )}

        <div aria-live="polite">
          {ok && <Text as="p" role="label" tone="success" live="status">{ok}</Text>}
        </div>
        {msg && <Text as="p" role="label" tone="danger" live="alert">{msg}</Text>}
      </CardBody>
    </Card>
  );
}
