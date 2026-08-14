"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import styles from "./explain-panel.module.css";

export type ExplainStrings = {
  readonly close: string;
  readonly blockedTitle: string;
  readonly drillFallback: string;
};

type ExplainApi = {
  readonly openEntry: (entry: MethodologyEntry) => void;
  readonly activeId: string | null;
};

const ExplainContext = createContext<ExplainApi | null>(null);

export function useExplain(): ExplainApi {
  const api = useContext(ExplainContext);
  if (!api) throw new Error("useExplain must be used inside ExplainProvider");
  return api;
}

export default function ExplainProvider({ strings, children }: {
  strings: ExplainStrings;
  children: ReactNode;
}) {
  const [entry, setEntry] = useState<MethodologyEntry | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openEntry = useCallback((next: MethodologyEntry) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setEntry(next);
  }, []);

  const close = useCallback(() => {
    setEntry(null);
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!entry) return;
    headingRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entry, close]);

  const api = useMemo<ExplainApi>(
    () => ({ openEntry, activeId: entry?.metricId ?? null }),
    [openEntry, entry],
  );

  return (
    <ExplainContext.Provider value={api}>
      <div className={styles.layout} data-open={entry ? "" : undefined}>
        <div className={styles.main}>{children}</div>
        {entry ? (
          <aside
            className={styles.panel}
            role="complementary"
            aria-labelledby={`sqx-explain-${entry.metricId}`}
          >
            <header className={styles.head}>
              <span className={styles.headline}>
                <div className={styles.title} tabIndex={-1} ref={headingRef}>
                  <Heading level={2} visual="subheading" id={`sqx-explain-${entry.metricId}`}>
                    {entry.title}
                  </Heading>
                </div>
                <Mono tone="muted">{entry.formulaId}</Mono>
              </span>
              <IconButton icon="dismiss" label={strings.close} onClick={close} />
            </header>
            <div className={styles.body}>
              {entry.blockedNote ? (
                <div className={styles.note}>
                  <StatusPill tone="warning" ping>{strings.blockedTitle}</StatusPill>
                  <p className={styles.noteText}><Text as="span" tone="inherit">{entry.blockedNote}</Text></p>
                </div>
              ) : null}
              <dl className={styles.rows}>
                {entry.rows.map(row => (
                  <div className={styles.row} key={row.label}>
                    <dt className={styles.rowLabel}><Text as="span" role="label" tone="muted">{row.label}</Text></dt>
                    <dd className={styles.rowValue}><Text as="span" role="bodyStrong" numeric>{row.value}</Text></dd>
                  </div>
                ))}
              </dl>
            </div>
            {entry.drillRoute ? (
              <footer className={styles.foot}>
                <Button variant="secondary" size="sm" href={entry.drillRoute} label={entry.drillLabel || strings.drillFallback}>
                  {entry.drillLabel || strings.drillFallback}
                </Button>
              </footer>
            ) : null}
          </aside>
        ) : null}
      </div>
    </ExplainContext.Provider>
  );
}
