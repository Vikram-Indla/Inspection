"use client";
import Button from "@/components/saqeel/button/button";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { DraftInfo } from "@/features/planning-single/shapes";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import styles from "./single-visit-screen.module.css";

export default function PublishActions({
  transitionsExecutable, hasTarget, savingDraft, draftSaveFailed, savedDraft,
  pending, resumeId, publishReady, onSaveDraft, strings,
}: {
  transitionsExecutable: boolean;
  hasTarget: boolean;
  savingDraft: boolean;
  draftSaveFailed: boolean;
  savedDraft: DraftInfo | null;
  pending: boolean;
  resumeId: string | null;
  publishReady: boolean;
  onSaveDraft: () => void;
  strings: SingleVisitStrings;
}) {
  return (
    <>
      {draftSaveFailed ? <PlanningNotice tone="danger">{strings.draftError}</PlanningNotice> : null}
      {savedDraft ? (
        <PlanningNotice tone="info">
          {strings.draftSavedPrefix} <bdi>{savedDraft.planReference}</bdi> · v{savedDraft.version}
        </PlanningNotice>
      ) : null}
      {transitionsExecutable ? null : (
        <PlanningNotice tone="warning">{strings.blockedTitle}</PlanningNotice>
      )}

      <div className={styles.actionBar}>
        <Button
          type="button"
          variant="secondary"
          disabled={!transitionsExecutable || savingDraft || !hasTarget}
          onClick={onSaveDraft}
          label={strings.saveDraft}
        >
          {savingDraft ? strings.savingDraft : strings.saveDraft}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!transitionsExecutable || pending || !publishReady}
          label={strings.publish}
        >
          {pending ? strings.publishing : resumeId ? strings.retry : strings.publish}
        </Button>
      </div>
    </>
  );
}
