"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { localForUser, mergeDraftSummaries, type DraftSummary, type OutboxOp } from "@/lib/offline";
import { fill } from "@/i18n/messages";
import styles from "./drafts.module.css";

export type ServerFieldDraft = DraftSummary & { factoryCode?: string | null };

type DraftMeta = { items: number | null; pending: boolean | null };

type SafeRead<T> = { value: T; ok: boolean };

async function safeRead<T>(read: () => Promise<T>, fallback: T): Promise<SafeRead<T>> {
  try {
    return { value: await read(), ok: true };
  } catch {
    return { value: fallback, ok: false };
  }
}

export type DraftListStrings = {
  resume: string;
  localDraft: string;
  empty: string;
  storeKey: string;
  itemsQueued: string;
  syncPending: string;
  syncLocal: string;
  loading: string;
  localUnavailable: string;
};

export default function DraftList({ userId, serverDrafts, strings }: {
  userId: string;
  serverDrafts: readonly ServerFieldDraft[];
  strings: DraftListStrings;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, DraftMeta> | null>(null);
  const [localState, setLocalState] = useState<"loading" | "ready" | "error">("loading");

  const serverKey = serverDrafts.map(draft => draft.inspectionId).join(",");

  useEffect(() => {
    const alive = { current: true };
    void (async () => {
      const idsRead = await safeRead<string[]>(() => local.draftInspectionIds(), []);
      if (!alive.current) return;
      setLocalIds(idsRead.value);

      const opsRead = await safeRead<OutboxOp[]>(() => local.peekAll(), []);
      const queued = opsRead.ok
        ? new Set(
            opsRead.value
              .map(op => ("inspection_id" in op ? op.inspection_id : null))
              .filter((id): id is string => !!id),
          )
        : null;

      const merged = [...new Set([...serverKey.split(",").filter(Boolean), ...idsRead.value])];
      const itemReads = await Promise.all(
        merged.map(id => safeRead<number | null>(() => local.getDrafts(id).then(list => list.length), null)),
      );
      const next: Record<string, DraftMeta> = Object.fromEntries(
        merged.map((id, index) => [id, { items: itemReads[index].value, pending: queued ? queued.has(id) : null }]),
      );
      const readFailed = !idsRead.ok || !opsRead.ok || itemReads.some(read => !read.ok);
      if (alive.current) {
        setMeta(next);
        setLocalState(readFailed ? "error" : "ready");
      }
    })();
    return () => { alive.current = false; };
  }, [local, serverKey]);

  const drafts = useMemo(
    () => mergeDraftSummaries(localIds, [...serverDrafts], strings.localDraft),
    [serverDrafts, localIds, strings.localDraft],
  );

  const codeFor = useMemo(() => {
    const byInspection = new Map(serverDrafts.map(draft => [draft.inspectionId, draft.factoryCode ?? null]));
    return (inspectionId: string) => byInspection.get(inspectionId) ?? null;
  }, [serverDrafts]);

  return (
    <>
      {localState === "loading" && drafts.length === 0 ? (
        <Text tone="muted" live="status">{strings.loading}</Text>
      ) : null}
      {localState === "error" ? (
        <Text tone="danger" live="alert">{strings.localUnavailable}</Text>
      ) : null}
      {localState !== "loading" && drafts.length === 0 ? (
        <Text tone="muted">{strings.empty}</Text>
      ) : null}

      {drafts.map(draft => {
        const rowMeta = meta?.[draft.inspectionId] ?? null;
        const code = codeFor(draft.inspectionId);
        return (
          <Card key={`draft-${draft.inspectionId}`} as="article" interactive>
            <CardBody>
              <a
                href={`/field/inspection/${draft.inspectionId}`}
                className={styles.draftLink}
                aria-label={`${strings.resume}: ${draft.factoryName}`}
              >
                <span className={styles.draftGlyph} aria-hidden="true">
                  <Icon name="forms" size="md" />
                </span>
                <span className={styles.draftBody}>
                  <span className={styles.draftHead}>
                    <Text role="bodyStrong" as="span" dir="auto" clamp={2}>{draft.factoryName}</Text>
                    <span className={styles.grow} />
                    {rowMeta && rowMeta.pending !== null ? (
                      <StatusPill tone={rowMeta.pending ? "warning" : "neutral"} ping={false}>
                        {rowMeta.pending ? strings.syncPending : strings.syncLocal}
                      </StatusPill>
                    ) : null}
                  </span>
                  {code ? <Mono as="span" tone="muted">{code}</Mono> : null}
                  {rowMeta && rowMeta.items !== null && rowMeta.items > 0 ? (
                    <Mono as="span" tone="muted">
                      {`${strings.storeKey}: ${draft.inspectionId}:* · ${fill(strings.itemsQueued, { count: rowMeta.items })}`}
                    </Mono>
                  ) : null}
                </span>
              </a>
            </CardBody>
          </Card>
        );
      })}
    </>
  );
}
