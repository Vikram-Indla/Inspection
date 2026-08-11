import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { ImmediateScreenStrings } from "@/features/planning-immediate/strings";
import type { FactoryHandoff } from "@/features/planning-immediate/types";
import { fill } from "@/i18n/messages";

export default function ImmediatePageContext({ handoff, strings }: {
  handoff: FactoryHandoff;
  strings: ImmediateScreenStrings;
}) {
  const linked = handoff.crNumber !== null && handoff.licenseNumber !== null;

  return (
    <>
      <StatusPill tone="warning">{strings.context}</StatusPill>
      {linked ? (
        <StatusPill tone="info">
          {fill(strings.factory360Context, { cr: handoff.crNumber ?? "", license: handoff.licenseNumber ?? "" })}
        </StatusPill>
      ) : null}
    </>
  );
}
