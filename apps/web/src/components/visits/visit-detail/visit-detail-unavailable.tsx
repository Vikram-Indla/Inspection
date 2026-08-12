import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";

export default function VisitDetailUnavailable({ current, kind, strings }: {
  current: string;
  kind: "error" | "not-found";
  strings: {
    readonly errorTitle: string;
    readonly notFoundTitle: string;
    readonly notFound: string;
    readonly notFoundDesc: string;
  };
}) {
  const isError = kind === "error";
  return (
    <Shell current={current} title={isError ? strings.errorTitle : strings.notFoundTitle}>
      <EmptyState
        icon="restricted"
        tone={isError ? "danger" : "warning"}
        title={isError ? strings.errorTitle : strings.notFound}
        description={strings.notFoundDesc}
      />
    </Shell>
  );
}
