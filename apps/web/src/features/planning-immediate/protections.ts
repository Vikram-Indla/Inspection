import type { ImmediateMessages } from "./strings";

export type Protection = {
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly controlId: string | null;
};

export type ProtectionInput = {
  readonly blockingField: string | null;
  readonly reasonSatisfied: boolean;
  readonly reasonNeedsNotes: boolean;
  readonly identitySatisfied: boolean;
  readonly locationSatisfied: boolean;
  readonly windowSatisfied: boolean;
};

type Candidate = Protection & { readonly blocking: boolean };

const blocked = (input: ProtectionInput, field: string, satisfied: boolean): boolean =>
  input.blockingField === field || !satisfied;

const asProtection = ({ id, name, detail, controlId }: Candidate): Protection =>
  ({ id, name, detail, controlId });

export function dispatchBlockers(
  input: ProtectionInput,
  messages: ImmediateMessages,
): readonly Protection[] {
  const { name, detail } = messages.protections;
  const candidates: readonly Candidate[] = [
    {
      id: "reason",
      name: name.reason,
      controlId: "imm-reason",
      blocking: blocked(input, "reason", input.reasonSatisfied),
      detail: input.reasonNeedsNotes ? detail.reasonOtherBlocked : detail.reasonBlocked,
    },
    {
      id: "identity",
      name: name.identity,
      controlId: "imm-search",
      blocking: blocked(input, "identity", input.identitySatisfied),
      detail: detail.identityBlocked,
    },
    {
      id: "location",
      name: name.location,
      controlId: "imm-lat",
      blocking: blocked(input, "location", input.locationSatisfied),
      detail: detail.locationBlocked,
    },
    {
      id: "window",
      name: name.window,
      controlId: null,
      blocking: blocked(input, "window", input.windowSatisfied),
      detail: detail.windowBlocked,
    },
  ];

  return candidates.filter(candidate => candidate.blocking).map(asProtection);
}
