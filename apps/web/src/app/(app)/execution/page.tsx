import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import ExecutionAccessState from "@/components/sections/execution/execution-access-state/execution-access-state";
import ExecutionWorkspace from "@/components/sections/execution/execution-workspace/execution-workspace";
import { loadExecution } from "@/features/execution/queries";
import { buildDeniedStrings, buildErrorStrings, buildScreenStrings } from "@/features/execution/strings";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const locale = await getLocale();
  const loaded = await loadExecution(locale);
  if (loaded.kind === "unauthenticated") redirect("/login");

  return (
    <Shell current="/execution" title={buildScreenStrings(locale).title}>
      {loaded.kind === "ready" ? (
        <ExecutionWorkspace
          rows={loaded.rows}
          currentUserId={loaded.currentUserId}
          locale={locale}
          totalVisibleRows={loaded.totalVisibleRows}
          omittedRows={loaded.omittedRows}
          nowMs={Date.now()}
        />
      ) : (
        <ExecutionAccessState
          kind={loaded.kind}
          denied={buildDeniedStrings(locale)}
          error={buildErrorStrings(locale)}
        />
      )}
    </Shell>
  );
}
