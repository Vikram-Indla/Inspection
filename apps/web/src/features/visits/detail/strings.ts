import type { VisitActionsStrings } from "@/components/visits/visit-actions/visit-actions-strings";
import type { AttachmentsStrings } from "@/app/(app)/visits/[id]/Attachments";
import type { NotesStrings } from "@/app/(app)/visits/[id]/NotesEditor";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export function buildVisitDetailStrings(locale: Locale, enumLabel: (value: string) => string) {
  const V = getMessages(locale).visits;
  const attachmentsStrings: AttachmentsStrings = {
    heading: V.att.heading,
    hint: V.att.hint,
    empty: V.att.empty,
    colFile: V.att.colFile,
    colType: V.att.colType,
    colUploaded: V.att.colUploaded,
    colBy: V.att.colBy,
    colActions: V.att.colActions,
    download: V.att.download,
    remove: V.att.remove,
    removeAria: V.att.removeAria,
    fileLabel: V.att.fileLabel,
    dropPrompt: V.att.dropPrompt,
    browse: V.att.browse,
    fileSelected: V.att.fileSelected,
    previewAlt: V.att.previewAlt,
    removeFile: V.att.removeFile,
    uploadBtn: V.att.uploadBtn,
    urlFailed: V.att.urlFailed,
  };
  const notesStrings: NotesStrings = {
    heading: V.notes.heading,
    label: V.notes.label,
    placeholder: V.notes.placeholder,
    saveBtn: V.notes.saveBtn,
    hint: V.notes.hint,
  };
  const A = V.actions;
  const actionStrings: VisitActionsStrings = {
    heading: A.heading,
    hint: A.hint,
    cutoffTitle: A.cutoffTitle,
    cutoffBody: A.cutoffBody,
    zoneAvailable: A.zoneAvailable,
    zoneBlocked: A.zoneBlocked,
    zoneUnavailable: A.zoneUnavailable,
    scheduleLockedActions: A.scheduleLockedActions,
    scheduleLockedWhy: A.scheduleLockedWhy,
    reassignLockedWhy: A.reassignLockedWhy,
    noneAvailable: A.noneAvailable,
    republishBtn: A.republishBtn,
    duplicateBtn: A.duplicateBtn,
    duplicateWhy: A.duplicateWhy,
    finalState: A.finalState,
    returnForm: {
      reason: A.returnReason,
      reasonPlaceholder: A.returnReasonPlaceholder,
      comments: A.returnComments,
      commentsHint: A.commentsHint,
      noOptions: A.noOptions,
      required: A.required,
      submit: A.returnBtn,
    },
    reassignForm: {
      inspector: A.reassignTo,
      inspectorPlaceholder: A.reassignToPlaceholder,
      reason: A.reassignReason,
      noOptions: A.noOptions,
      required: A.required,
      submit: A.reassignBtn,
    },
    visitTypeForm: { label: A.visitTypeLabel, submit: A.visitTypeBtn },
    rescheduleForm: {
      window: A.newWindow,
      required: A.required,
      submit: A.rescheduleBtn,
      notSet: A.windowNotSet,
      timeFrom: A.newWindowStart,
      timeTo: A.newWindowEnd,
      previousMonth: A.previousMonth,
      nextMonth: A.nextMonth,
      range: {
        from: A.newWindowStart,
        to: A.newWindowEnd,
        pickStart: A.pickStart,
        pickEnd: A.pickEnd,
        reset: A.windowReset,
        apply: A.windowApply,
        empty: A.windowNotSet,
      },
    },
    cancelForm: { comments: A.cancelComments, commentsHint: A.commentsHint, submit: A.cancelBtn },
    repackageForm: {
      label: A.repackageLabel,
      placeholder: A.repackagePlaceholder,
      noOptions: A.noOptions,
      required: A.required,
      submit: A.repackageBtn,
    },
  };
  const visitTypes = [
    { value: "periodic", label: enumLabel("periodic") },
    { value: "follow_up", label: enumLabel("follow_up") },
    { value: "complaint", label: enumLabel("complaint") },
  ];
  return { attachmentsStrings, notesStrings, actionStrings, visitTypes };
}
