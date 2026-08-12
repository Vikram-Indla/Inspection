import type { ActionBarStrings } from "@/app/(app)/visits/[id]/ActionBar";
import type { AttachmentsStrings } from "@/app/(app)/visits/[id]/Attachments";
import type { NotesStrings } from "@/app/(app)/visits/[id]/NotesEditor";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export function buildVisitDetailStrings(locale: Locale, enumLabel: (value: string) => string) {
  const V = getMessages(locale).visits;
  const attachmentsStrings: AttachmentsStrings = {
    heading: V.att.heading,
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
    uploadBtn: V.att.uploadBtn,
    uploading: V.att.uploading,
    urlFailed: V.att.urlFailed,
  };
  const notesStrings: NotesStrings = {
    heading: V.notes.heading,
    label: V.notes.label,
    placeholder: V.notes.placeholder,
    saveBtn: V.notes.saveBtn,
    saving: V.notes.saving,
    hint: V.notes.hint,
  };
  const actionStrings: ActionBarStrings = {
    heading: V.actions.heading,
    returnReason: V.actions.returnReason,
    returnComments: V.actions.returnComments,
    returnBtn: V.actions.returnBtn,
    republishBtn: V.actions.republishBtn,
    reassignTo: V.actions.reassignTo,
    reassignReason: V.actions.reassignReason,
    reassignBtn: V.actions.reassignBtn,
    newWindowStart: V.actions.newWindowStart,
    newWindowEnd: V.actions.newWindowEnd,
    rescheduleBtn: V.actions.rescheduleBtn,
    cancelReason: V.actions.cancelReason,
    cancelComments: V.actions.cancelComments,
    cancelBtn: V.actions.cancelBtn,
    visitTypeLabel: V.actions.visitTypeLabel,
    visitTypeBtn: V.actions.visitTypeBtn,
    typePeriodic: enumLabel("periodic"),
    typeFollowUp: enumLabel("follow_up"),
    typeComplaint: enumLabel("complaint"),
    executionStarted: V.actions.executionStarted,
    finalState: V.actions.finalState,
    zoneAvailable: V.actions.zoneAvailable,
    zoneBlocked: V.actions.zoneBlocked,
    zoneUnavailable: V.actions.zoneUnavailable,
    reassignLockedWhy: V.actions.reassignLockedWhy,
    scheduleLockedWhy: V.actions.scheduleLockedWhy,
    noneAvailable: V.actions.noneAvailable,
    commentsHint: V.actions.commentsHint,
    repackageLabel: V.actions.repackageLabel,
    repackageBtn: V.actions.repackageBtn,
    duplicateBtn: V.actions.duplicateBtn,
    duplicateWhy: V.actions.duplicateWhy,
    cutoffTitle: V.actions.cutoffTitle,
    cutoffBody: V.actions.cutoffBody,
  };
  return { attachmentsStrings, notesStrings, actionStrings };
}
