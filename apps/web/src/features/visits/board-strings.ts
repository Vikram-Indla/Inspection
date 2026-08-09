import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import type { VisitAllowedKey } from "./rows";

export type VisitsBoardStrings = {
  readonly colVisit: string;
  readonly colFactory: string;
  readonly colTypeMode: string;
  readonly colPlanning: string;
  readonly colOperational: string;
  readonly colInspector: string;
  readonly colWindow: string;
  readonly caption: string;
  readonly selectAll: string;
  readonly selectRow: string;
  readonly selected: string;
  readonly clearSelection: string;
  readonly openDetail: string;
  readonly preview: string;
  readonly noMatchTitle: string;
  readonly noMatchBody: string;
  readonly showing: string;
  readonly loadMore: string;
  readonly spineHeading: string;
  readonly spineEmpty: string;
  readonly spineOpenDetail: string;
  readonly spineWindow: string;
  readonly spineInspector: string;
  readonly allowed: Record<VisitAllowedKey, string>;
  readonly bulkHeading: string;
  readonly bulkWindowStart: string;
  readonly bulkWindowEnd: string;
  readonly bulkReason: string;
  readonly bulkRescheduleBtn: string;
  readonly bulkReassignTo: string;
  readonly bulkReassignBtn: string;
  readonly reassignUnavailable: string;
  readonly reassignNoInspectors: string;
  readonly bulkSelectOption: string;
  readonly bulkCancelNote: string;
  readonly bulkCancelPlaceholder: string;
  readonly bulkCancelBtn: string;
  readonly bulkEditType: string;
  readonly bulkEditNotes: string;
  readonly bulkEditNotesPlaceholder: string;
  readonly bulkEditSetNotes: string;
  readonly bulkEditBtn: string;
  readonly eligHeading: string;
  readonly eligVerified: string;
  readonly eligCount: string;
  readonly eligSamePlanBlocked: string;
  readonly eligReschedule: string;
  readonly eligReassign: string;
  readonly eligCancel: string;
  readonly eligEdit: string;
  readonly ledgerColVisit: string;
  readonly ledgerColOutcome: string;
  readonly ledgerColReason: string;
  readonly ledgerOpen: string;
  readonly ledgerSummaryApplied: string;
  readonly ledgerSummaryBlocked: string;
  readonly ledgerSummaryNoNotif: string;
  readonly ledgerRetrySafe: string;
  readonly progressBusy: string;
  readonly frozenSelection: string;
  readonly verb: Record<string, string>;
  readonly receiptCommand: string;
  readonly receiptStatus: string;
  readonly receiptProgress: string;
  readonly receiptInventory: string;
  readonly receiptUnknown: string;
  readonly outcome: Record<string, string>;
  readonly outcomeShort: Record<string, string>;
  readonly error: Record<string, string>;
};

export function buildVisitsBoardStrings(locale: Locale): VisitsBoardStrings {
  const { visit } = getMessages(locale).planning;
  return {
    colVisit: visit.table.colVisit,
    colFactory: visit.table.colFactory,
    colTypeMode: visit.table.colTypeMode,
    colPlanning: visit.table.colPlanning,
    colOperational: visit.table.colOperational,
    colInspector: visit.table.colInspector,
    colWindow: visit.table.colWindow,
    caption: visit.table.caption,
    selectAll: visit.table.selectAll,
    selectRow: visit.table.selectRow,
    selected: visit.table.selected,
    clearSelection: visit.table.clearSelection,
    openDetail: visit.table.openDetail,
    preview: visit.table.preview,
    noMatchTitle: visit.state.noMatchTitle,
    noMatchBody: visit.state.noMatchBody,
    showing: visit.table.showing,
    loadMore: visit.table.loadMore,
    spineHeading: visit.spine.heading,
    spineEmpty: visit.spine.empty,
    spineOpenDetail: visit.spine.openDetail,
    spineWindow: visit.spine.window,
    spineInspector: visit.spine.inspector,
    allowed: {
      editable: visit.spine.allowedEditable,
      locked: visit.spine.allowedLocked,
      final: visit.spine.allowedFinal,
      expired: visit.spine.allowedExpired,
    },
    bulkHeading: visit.bulk.heading,
    bulkWindowStart: visit.bulk.windowStart,
    bulkWindowEnd: visit.bulk.windowEnd,
    bulkReason: visit.bulk.reason,
    bulkRescheduleBtn: visit.bulk.rescheduleBtn,
    bulkReassignTo: visit.bulk.reassignTo,
    bulkReassignBtn: visit.bulk.reassignBtn,
    reassignUnavailable: visit.bulk.reassignUnavailable,
    reassignNoInspectors: visit.bulk.reassignNoInspectors,
    bulkSelectOption: visit.bulk.selectOption,
    bulkCancelNote: visit.bulk.cancelNote,
    bulkCancelPlaceholder: visit.bulk.cancelPlaceholder,
    bulkCancelBtn: visit.bulk.cancelBtn,
    bulkEditType: visit.bulk.editType,
    bulkEditNotes: visit.bulk.editNotes,
    bulkEditNotesPlaceholder: visit.bulk.editNotesPlaceholder,
    bulkEditSetNotes: visit.bulk.editSetNotes,
    bulkEditBtn: visit.bulk.editBtn,
    eligHeading: visit.elig.heading,
    eligVerified: visit.elig.verified,
    eligCount: visit.elig.count,
    eligSamePlanBlocked: visit.elig.samePlanBlocked,
    eligReschedule: visit.elig.reschedule,
    eligReassign: visit.elig.reassign,
    eligCancel: visit.elig.cancel,
    eligEdit: visit.elig.edit,
    ledgerColVisit: visit.ledger.colVisit,
    ledgerColOutcome: visit.ledger.colOutcome,
    ledgerColReason: visit.ledger.colReason,
    ledgerOpen: visit.ledger.open,
    ledgerSummaryApplied: visit.ledger.summaryApplied,
    ledgerSummaryBlocked: visit.ledger.summaryBlocked,
    ledgerSummaryNoNotif: visit.ledger.summaryNoNotif,
    ledgerRetrySafe: visit.ledger.retrySafe,
    progressBusy: visit.ledger.progressBusy,
    frozenSelection: visit.ledger.frozenSelection,
    verb: {
      reschedule: visit.ledger.verbReschedule,
      reassign: visit.ledger.verbReassign,
      cancel: visit.ledger.verbCancel,
      edit: visit.ledger.verbEdit,
    },
    receiptCommand: visit.receipt.command,
    receiptStatus: visit.receipt.status,
    receiptProgress: visit.receipt.progress,
    receiptInventory: visit.receipt.inventory,
    receiptUnknown: visit.receipt.unknown,
    outcome: {
      applied: visit.outcome.applied,
      applied_no_notification: visit.outcome.noNotif,
      blocked_not_publishable: visit.outcome.blockedNotPub,
      blocked_started: visit.outcome.blockedStarted,
      blocked_no_assignment: visit.outcome.blockedNoAssign,
      error: visit.outcome.error,
    },
    outcomeShort: {
      applied: visit.outcome.applied,
      applied_no_notification: visit.outcome.shortNoNotif,
      blocked_not_publishable: visit.outcome.shortBlocked,
      blocked_started: visit.outcome.shortBlocked,
      blocked_no_assignment: visit.outcome.shortBlocked,
      error: visit.outcome.shortError,
    },
    error: {
      select_one: visit.err.selectOne,
      reason_required: visit.err.reasonRequired,
      reasons_unavailable: visit.err.reasonsUnavailable,
      session: visit.err.session,
      window_required: visit.err.windowRequired,
      window_invalid: visit.err.windowInvalid,
      window_order: visit.err.windowOrder,
      inspector_required: visit.err.inspectorRequired,
      type_or_notes_required: visit.err.typeOrNotes,
    },
  };
}
