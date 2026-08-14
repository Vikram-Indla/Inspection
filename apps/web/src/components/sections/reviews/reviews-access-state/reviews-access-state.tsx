import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { ReviewsStrings } from "@/features/reviews/strings";

export default function ReviewsAccessState({ strings }: { strings: ReviewsStrings }) {
  return (
    <EmptyState
      icon="restricted"
      tone="danger"
      title={strings.unauthorized.title}
      description={strings.unauthorized.body}
    />
  );
}
