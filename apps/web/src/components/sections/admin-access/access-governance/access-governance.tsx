import GovernanceNote from "@/components/saqeel/governance-note/governance-note";
import type { AdminAccessMessages } from "@/features/admin-access/strings";

export default function AccessGovernance({ strings, readOnly }: {
  strings: AdminAccessMessages;
  readOnly: boolean;
}) {
  const lines = readOnly
    ? [strings.governance.rls, strings.governance.readOnly]
    : [strings.governance.rls, strings.governance.audit, strings.governance.effect];

  return <GovernanceNote label={strings.governance.heading} lines={lines} />;
}
