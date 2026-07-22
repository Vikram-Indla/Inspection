"use client";

import { useEffect, useMemo, useState } from "react";
import { localForUser, mergeDraftSummaries, type DraftSummary } from "@/lib/offline";

export type ServerFieldDraft = DraftSummary;

export default function FieldDraftList({ userId, serverDrafts, draftLabel, resumeLabel, localLabel, emptyLabel }: {
  userId: string;
  serverDrafts: ServerFieldDraft[];
  draftLabel: string;
  resumeLabel: string;
  localLabel: string;
  emptyLabel?: string;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  // Server drafts render immediately — local (IndexedDB) drafts are a
  // client-only enhancement layered in once ready. Gating the whole list on
  // the IndexedDB read resolving left the page permanently blank whenever
  // that read stalled or never settled, even with server data already in hand.
  const [localIds, setLocalIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    void local.draftInspectionIds()
      .then(ids => { if (alive) setLocalIds(ids); })
      .catch(() => { if (alive) setLocalIds([]); });
    return () => { alive = false; };
  }, [local]);

  const drafts = useMemo(() => {
    return mergeDraftSummaries(localIds, serverDrafts, localLabel);
  }, [serverDrafts, localIds, localLabel]);

  if (!drafts.length) return emptyLabel ? <span className="ax-caption">{emptyLabel}</span> : null;
  return (
    <>
      {drafts.slice(0, 4).map(draft => (
        <div key={`draft-${draft.inspectionId}`} className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
          <span className="ax-lozenge ax-lozenge--warning">{draftLabel}</span>
          <span style={{ flex: 1 }} className="ax-caption">{draft.factoryName}</span>
          <a className="ax-btn ax-btn--subtle" href={`/field/inspection/${draft.inspectionId}`}>{resumeLabel}</a>
        </div>
      ))}
    </>
  );
}
