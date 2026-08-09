import type { TimelineEvent } from "@/components/saqeel/timeline/timeline";
import { fill } from "@/i18n/messages";
import type { ApprovalDetail } from "./queries";

export type ApprovalTimelineStrings = {
  readonly revisionCreated: string;
  readonly revisionSubmitted: string;
  readonly published: string;
  readonly object: string;
  readonly package: string;
};

/**
 * One ordered history from four sources.
 *
 * Revisions matter as much as decisions: without them the log starts at the
 * first review and a reviewer cannot see when the request was submitted, or
 * that it was returned and resubmitted. The legacy screen showed decisions and
 * publications only.
 */
export function buildApprovalTimeline(
  detail: ApprovalDetail,
  strings: ApprovalTimelineStrings,
  format: { readonly stamp: (iso: string) => string; readonly name: (userId: string) => string | null; readonly label: (value: string) => string },
): readonly TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const revision of detail.revisions) {
    events.push({
      id: `revision-${revision.revision_number}`,
      dateTime: revision.created_at,
      time: format.stamp(revision.created_at),
      title: fill(strings.revisionCreated, { revision: revision.revision_number }),
      meta: format.name(revision.created_by) ?? undefined,
    });
    if (revision.submitted_at) {
      events.push({
        id: `submitted-${revision.revision_number}`,
        dateTime: revision.submitted_at,
        time: format.stamp(revision.submitted_at),
        title: fill(strings.revisionSubmitted, { revision: revision.revision_number }),
        detail: revision.return_reason ?? undefined,
      });
    }
  }

  for (const decision of detail.decisions) {
    events.push({
      id: decision.id,
      dateTime: decision.decided_at,
      time: format.stamp(decision.decided_at),
      title: format.label(decision.decision),
      meta: decision.component_id ? strings.object : strings.package,
      detail: decision.comments ?? undefined,
    });
  }

  for (const publication of detail.publications) {
    events.push({
      id: publication.id,
      dateTime: publication.published_at,
      time: format.stamp(publication.published_at),
      title: strings.published,
      meta: publication.version_id,
    });
  }

  return events.sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""));
}
