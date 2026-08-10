export type ProtectionState = "satisfied" | "blocking" | "informational";

export type ActorMode = "planner" | "inspector";

export type Protection = {
  readonly id: string;
  readonly name: string;
  readonly state: ProtectionState;
  readonly detail: string;
  readonly controlId: string | null;
};

export type AuthorityStrings = {
  readonly heading: string;
  readonly satisfied: string;
  readonly blocking: string;
  readonly informational: string;
  readonly allSatisfied: string;
  readonly blockedEntry: string;
  readonly accessibleName: string;
  readonly name: {
    readonly authorized: string;
    readonly reason: string;
    readonly identity: string;
    readonly location: string;
    readonly checklist: string;
    readonly inspector: string;
    readonly window: string;
    readonly audit: string;
    readonly notify: string;
  };
  readonly detail: {
    readonly authorizedPlanner: string;
    readonly authorizedInspector: string;
    readonly reasonBlocked: string;
    readonly reasonOtherBlocked: string;
    readonly identityBlocked: string;
    readonly identityRegistered: string;
    readonly identityTemporary: string;
    readonly locationBlocked: string;
    readonly locationOfficial: string;
    readonly locationManual: string;
    readonly checklistOptional: string;
    readonly inspectorAuto: string;
    readonly inspectorManual: string;
    readonly windowImmediate: string;
    readonly windowSet: string;
    readonly windowBlocked: string;
    readonly auditRecorded: string;
    readonly notifyQueued: string;
    readonly notifyInspectorStart: string;
  };
};

export type AuthorityInput = {
  readonly actorMode: ActorMode;
  readonly serverBlockingField: string | null;
  readonly reasonOk: boolean;
  readonly reasonLabel: string;
  readonly reasonOtherWithoutNotes: boolean;
  readonly identityOk: boolean;
  readonly identityRegistered: boolean;
  readonly locationOk: boolean;
  readonly locationOfficial: boolean;
  readonly checklistLabel: string | null;
  readonly inspectorChosen: boolean;
  readonly windowOk: boolean;
};

const stateWord = (state: ProtectionState, strings: AuthorityStrings) =>
  state === "satisfied" ? strings.satisfied
    : state === "blocking" ? strings.blocking
      : strings.informational;

export function protectionAccessibleName(protection: Protection, strings: AuthorityStrings): string {
  return strings.accessibleName
    .replace("{label}", protection.name)
    .replace("{state}", stateWord(protection.state, strings))
    .replace("{detail}", protection.detail);
}

export function blockingProtections(protections: readonly Protection[]): readonly Protection[] {
  return protections.filter(protection => protection.state === "blocking");
}

export function blockedEntry(protection: Protection, strings: AuthorityStrings): string {
  return strings.blockedEntry
    .replace("{label}", protection.name)
    .replace("{detail}", protection.detail);
}

export function resolveProtections(input: AuthorityInput, strings: AuthorityStrings): readonly Protection[] {
  const { name, detail } = strings;
  const blocked = (field: string, clientOk: boolean) => input.serverBlockingField === field || !clientOk;
  const planner = input.actorMode === "planner";

  const reasonBlocked = blocked("reason", input.reasonOk);
  const identityBlocked = blocked("identity", input.identityOk);
  const locationBlocked = blocked("location", input.locationOk);
  const windowBlocked = blocked("window", input.windowOk);

  return [
    {
      id: "authorized",
      name: name.authorized,
      state: "satisfied",
      detail: planner ? detail.authorizedPlanner : detail.authorizedInspector,
      controlId: null,
    },
    {
      id: "reason",
      name: name.reason,
      state: reasonBlocked ? "blocking" : "satisfied",
      detail: reasonBlocked
        ? (input.reasonOtherWithoutNotes ? detail.reasonOtherBlocked : detail.reasonBlocked)
        : input.reasonLabel,
      controlId: "imm-reason",
    },
    {
      id: "identity",
      name: name.identity,
      state: identityBlocked ? "blocking" : "satisfied",
      detail: identityBlocked ? detail.identityBlocked
        : input.identityRegistered ? detail.identityRegistered : detail.identityTemporary,
      controlId: input.identityRegistered ? "imm-search" : "imm-not-found",
    },
    {
      id: "location",
      name: name.location,
      state: locationBlocked ? "blocking" : "satisfied",
      detail: locationBlocked ? detail.locationBlocked
        : input.locationOfficial ? detail.locationOfficial : detail.locationManual,
      controlId: "imm-lat",
    },
    {
      id: "checklist",
      name: name.checklist,
      state: "informational",
      detail: input.checklistLabel ?? detail.checklistOptional,
      controlId: "imm-package",
    },
    {
      id: "inspector",
      name: name.inspector,
      state: "informational",
      detail: input.inspectorChosen ? detail.inspectorManual : detail.inspectorAuto,
      controlId: planner ? "imm-inspector" : null,
    },
    {
      id: "window",
      name: name.window,
      state: windowBlocked ? "blocking" : "satisfied",
      detail: windowBlocked ? detail.windowBlocked
        : planner ? detail.windowSet : detail.windowImmediate,
      controlId: planner ? "imm-window-start" : null,
    },
    {
      id: "audit",
      name: name.audit,
      state: "informational",
      detail: detail.auditRecorded,
      controlId: null,
    },
    {
      id: "notify",
      name: name.notify,
      state: "informational",
      detail: planner ? detail.notifyQueued : detail.notifyInspectorStart,
      controlId: null,
    },
  ];
}
