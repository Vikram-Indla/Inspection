import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type ImmediateMessages = ReturnType<typeof getMessages>["planning"]["immediate"];

export function immediateMessages(locale: Locale): ImmediateMessages {
  return getMessages(locale).planning.immediate;
}

export type ImmediateScreenStrings = {
  readonly title: string;
  readonly context: string;
  readonly factory360Context: string;
  readonly returnToFactory: string;
};

export function immediateScreenStrings(locale: Locale): ImmediateScreenStrings {
  const { title, context, factory360Context, returnToFactory } = immediateMessages(locale);
  return { title, context, factory360Context, returnToFactory };
}

function identityStrings(messages: ImmediateMessages) {
  const { identity } = messages;
  return {
    identity: identity.heading,
    identityToggleRegistered: identity.toggleRegistered,
    identityToggleUnregistered: identity.toggleUnregistered,
    r05BlockedTitle: identity.r05Title,
    r05BlockedBody: identity.r05Body,
    manualLockedPermission: identity.lockedPermission,
    manualLockedType: identity.lockedType,
    manualLockedLookups: identity.lockedLookups,
    notFoundConfirm: identity.notFoundConfirm,
    searchLabel: identity.searchLabel,
    searchPlaceholder: identity.searchPlaceholder,
    searchNoMatch: identity.searchNoMatch,
    existingFactory: identity.existingFactory,
    selectOption: identity.selectOption,
    previewCr: identity.previewCr,
    previewLicense: identity.previewLicense,
    previewRegion: identity.previewRegion,
    previewFreshness: identity.previewFreshness,
    previewFreshnessNever: identity.previewFreshnessNever,
    previewRisk: identity.previewRisk,
    previewRiskUnknown: identity.previewRiskUnknown,
    manualName: identity.manualName,
    manualPlaceholder: identity.manualPlaceholder,
    manualCr: identity.manualCr,
    manualLicense: identity.manualLicense,
    manualActivity: identity.manualActivity,
    manualActivityPlaceholder: identity.manualActivityPlaceholder,
    manualRegion: identity.manualRegion,
    manualCity: identity.manualCity,
    manualCityPlaceholder: identity.manualCityPlaceholder,
    manualReasonLabel: identity.manualReasonLabel,
    manualReasonComment: identity.manualReasonComment,
    manualReasonCommentPlaceholder: identity.manualReasonCommentPlaceholder,
    notifyFactory: identity.notifyFactory,
    factoryMobile: identity.factoryMobile,
    factoryMobilePlaceholder: identity.factoryMobilePlaceholder,
    unverifiedBadge: identity.unverifiedBadge,
    attachmentRequiredNote: identity.attachmentRequiredNote,
    temporaryNote: identity.temporaryNote,
    visitType: identity.visitType,
  };
}

function reasonStrings(messages: ImmediateMessages) {
  const { reason } = messages;
  return {
    urgencyReason: reason.heading,
    reasonComplaint: reason.complaint,
    reasonIncident: reason.incident,
    reasonReferral: reason.referral,
    reasonOther: reason.other,
    reasonOtherHint: reason.otherHint,
  };
}

function locationStrings(messages: ImmediateMessages) {
  const { location } = messages;
  return {
    locationDispatch: location.heading,
    useOfficialLocation: location.useOfficial,
    latitude: location.latitude,
    longitude: location.longitude,
    locationSourceOfficial: location.sourceOfficial,
    locationSourceManual: location.sourceManual,
    locationSourceNone: location.sourceNone,
    mapLoading: location.mapLoading,
  };
}

function dispatchStrings(messages: ImmediateMessages) {
  const { dispatch } = messages;
  return {
    windowStart: dispatch.windowStart,
    windowEnd: dispatch.windowEnd,
    windowHint: dispatch.windowHint,
    priority: dispatch.priority,
    priorityPlaceholder: dispatch.priorityPlaceholder,
    packageLabel: dispatch.packageLabel,
    packageOptionalHint: dispatch.packageOptionalHint,
    packageClear: dispatch.packageClear,
    packageOptionalDetail: dispatch.packageOptionalDetail,
    inspector: dispatch.inspector,
    autoAssign: dispatch.autoAssign,
    inspectorAutoDetail: dispatch.inspectorAutoDetail,
    inspectorStartNow: dispatch.inspectorStartNow,
    notes: dispatch.notes,
    notesPlaceholder: dispatch.notesPlaceholder,
  };
}

function protectionStrings(messages: ImmediateMessages) {
  const { protections } = messages;
  return {
    chipGroupLabel: protections.groupLabel,
    chipSatisfied: protections.satisfied,
    chipBlocking: protections.blocking,
    chipTruth: protections.informational,
    chipAllSatisfied: protections.allSatisfied,
    chipBlockedAnnouncement: protections.blockedAnnouncement,
    chipAuthorizedLabel: protections.name.authorized,
    chipReasonLabel: protections.name.reason,
    chipIdentityLabel: protections.name.identity,
    chipLocationLabel: protections.name.location,
    chipPackageLabel: protections.name.checklist,
    chipInspectorLabel: protections.name.inspector,
    chipWindowLabel: protections.name.window,
    chipAuditLabel: protections.name.audit,
    chipNotifyLabel: protections.name.notify,
    chipAuthorizedDetail: protections.detail.authorizedPlanner,
    chipReasonBlocked: protections.detail.reasonBlocked,
    chipReasonOtherBlocked: protections.detail.reasonOtherBlocked,
    chipIdentityBlocked: protections.detail.identityBlocked,
    chipIdentityRegistered: protections.detail.identityRegistered,
    chipIdentityTemporary: protections.detail.identityTemporary,
    chipLocationBlocked: protections.detail.locationBlocked,
    chipLocationOfficial: protections.detail.locationOfficial,
    chipLocationManual: protections.detail.locationManual,
    chipPackageBlocked: protections.detail.checklistBlocked,
    chipInspectorAuto: protections.detail.inspectorAuto,
    chipInspectorManual: protections.detail.inspectorManual,
    chipInspectorBlocked: protections.detail.inspectorBlocked,
    chipWindowImmediate: protections.detail.windowImmediate,
    chipWindowSet: protections.detail.windowSet,
    chipWindowBlocked: protections.detail.windowBlocked,
    chipAuditDetail: protections.detail.auditDetail,
    chipNotifyDetail: protections.detail.notifyDetail,
  };
}

function outcomeStrings(messages: ImmediateMessages) {
  const { consequences, enforcement, submit } = messages;
  return {
    consequenceTitle: consequences.heading,
    consequenceVisit: consequences.visit,
    consequenceAssign: consequences.assign,
    consequenceNotify: consequences.notify,
    consequenceAudit: consequences.audit,
    reviewConfirm: consequences.reviewConfirm,
    enforcementLabel: enforcement.label,
    enforcementHint: enforcement.hint,
    enforcementNone: enforcement.none,
    enforcementFine: enforcement.fine,
    enforcementCommittee: enforcement.committee,
    enforcementWarning: enforcement.warning,
    enforcementClosure: enforcement.closure,
    enforcementNotes: enforcement.notes,
    enforcementNotesPlaceholder: enforcement.notesPlaceholder,
    blockedTitle: submit.blockedTitle,
    create: submit.create,
    createAndStart: submit.create,
    creating: submit.creating,
  };
}

export type ImmediateFormStrings =
  & ReturnType<typeof identityStrings>
  & ReturnType<typeof reasonStrings>
  & ReturnType<typeof locationStrings>
  & ReturnType<typeof dispatchStrings>
  & ReturnType<typeof protectionStrings>
  & ReturnType<typeof outcomeStrings>;

export function immediateFormStrings(locale: Locale): ImmediateFormStrings {
  const messages = immediateMessages(locale);
  return {
    ...identityStrings(messages),
    ...reasonStrings(messages),
    ...locationStrings(messages),
    ...dispatchStrings(messages),
    ...protectionStrings(messages),
    ...outcomeStrings(messages),
  };
}
