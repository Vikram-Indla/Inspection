import Shell from "@/components/Shell";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";

export default function AccessNotice({ current, title, heading, body, returnLabel }: {
  current: string;
  title: string;
  heading: string;
  body: string;
  returnLabel: string;
}) {
  return (
    <Shell current={current} title={title}>
      <EmptyState
        icon="restricted"
        tone="warning"
        title={heading}
        description={body}
        action={
          <Button variant="secondary" href="/launch" label={returnLabel}>
            {returnLabel}
          </Button>
        }
      />
    </Shell>
  );
}
