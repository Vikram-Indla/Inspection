import type { ImmediateMessages } from "./strings";
import type { ActorMode } from "./types";

export type ProtectionState = "satisfied" | "blocking" | "informational";

export type Protection = {
  readonly id: string;
  readonly name: string;
  readonly state: ProtectionState;
  readonly detail: string;
  readonly controlId: string | null;
};

export type ProtectionInput = {
  readonly blockingField: string | null;
  readonly actorMode: ActorMode;
  readonly identityMode: "registered" | "unregistered";
  readonly reasonSatisfied: boolean;
  readonly reasonLabel: string;
  readonly reasonNeedsNotes: boolean;
  readonly identitySatisfied: boolean;
  readonly locationSatisfied: boolean;
  readonly locationSource: "official" | "manual" | null;
  readonly checklistLabel: string | null;
  readonly inspectorChosen: boolean;
  readonly windowSatisfied: boolean;
};

const blocked = (input: ProtectionInput, field: string, satisfied: boolean): boolean =>
  input.blockingField === field || !satisfied;

function targetProtections(input: ProtectionInput, messages: ImmediateMessages): readonly Protection[] {
  const { name, detail } = messages.protections;
  const reasonBlocked = blocked(input, "reason", input.reasonSatisfied);
  const identityBlocked = blocked(input, "identity", input.identitySatisfied);
  const locationBlocked = blocked(input, "location", input.locationSatisfied);

  return [
    {
      id: "authorized",
      name: name.authorized,
      state: "satisfied",
      controlId: null,
      detail: input.actorMode === "planner" ? detail.authorizedPlanner : detail.authorizedInspector,
    },
    {
      id: "reason",
      name: name.reason,
      state: reasonBlocked ? "blocking" : "satisfied",
      controlId: "imm-reason",
      detail: reasonBlocked
        ? (input.reasonNeedsNotes ? detail.reasonOtherBlocked : detail.reasonBlocked)
        : input.reasonLabel,
    },
    {
      id: "identity",
      name: name.identity,
      state: identityBlocked ? "blocking" : "satisfied",
      controlId: input.identityMode === "registered" ? "imm-search" : "imm-not-found",
      detail: identityBlocked
        ? detail.identityBlocked
        : (input.identityMode === "registered" ? detail.identityRegistered : detail.identityTemporary),
    },
    {
      id: "location",
      name: name.location,
      state: locationBlocked ? "blocking" : "satisfied",
      controlId: "imm-lat",
      detail: locationBlocked
        ? detail.locationBlocked
        : (input.locationSource === "official" ? detail.locationOfficial : detail.locationManual),
    },
  ];
}

function scheduleProtections(input: ProtectionInput, messages: ImmediateMessages): readonly Protection[] {
  const { name, detail } = messages.protections;
  const plannerOwned = input.actorMode === "planner";
  const windowBlocked = blocked(input, "window", input.windowSatisfied);

  return [
    {
      id: "checklist",
      name: name.checklist,
      state: "informational",
      controlId: "imm-package",
      detail: input.checklistLabel ?? messages.dispatch.packageOptionalDetail,
    },
    {
      id: "inspector",
      name: name.inspector,
      state: "informational",
      controlId: plannerOwned ? "imm-inspector" : null,
      detail: input.inspectorChosen ? detail.inspectorManual : messages.dispatch.inspectorAutoDetail,
    },
    {
      id: "window",
      name: name.window,
      state: windowBlocked ? "blocking" : "satisfied",
      controlId: plannerOwned ? "imm-window-start" : null,
      detail: windowBlocked
        ? detail.windowBlocked
        : (plannerOwned ? detail.windowSet : detail.windowImmediate),
    },
  ];
}

function systemProtections(input: ProtectionInput, messages: ImmediateMessages): readonly Protection[] {
  const { name, detail } = messages.protections;

  return [
    { id: "audit", name: name.audit, state: "informational", controlId: null, detail: detail.auditDetail },
    {
      id: "notify",
      name: name.notify,
      state: "informational",
      controlId: null,
      detail: input.actorMode === "planner" ? detail.notifyDetail : messages.dispatch.inspectorStartNow,
    },
  ];
}

export function dispatchProtections(
  input: ProtectionInput,
  messages: ImmediateMessages,
): readonly Protection[] {
  return [
    ...targetProtections(input, messages),
    ...scheduleProtections(input, messages),
    ...systemProtections(input, messages),
  ];
}

export function blockingProtections(protections: readonly Protection[]): readonly Protection[] {
  return protections.filter(protection => protection.state === "blocking");
}
