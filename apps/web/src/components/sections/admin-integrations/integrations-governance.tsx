import GovernanceNote from "@/components/saqeel/governance-note/governance-note";
import type { AdminIntegrationsMessages } from "@/features/admin-integrations/strings";

export default function IntegrationsGovernance({ strings }: { strings: AdminIntegrationsMessages }) {
  return (
    <GovernanceNote
      label={strings.governance.title}
      lines={[...strings.governance.points, strings.governance.note]}
    />
  );
}
