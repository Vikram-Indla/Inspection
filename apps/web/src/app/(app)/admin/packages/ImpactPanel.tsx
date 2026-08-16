import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import styles from "./impact-panel.module.css";

export type ReferencingPackage = {
  code: string; title: string; label: string; sharedItems: string[];
};

export type DefinitionDiff = {
  isCurrentPublished: boolean;
  comparedLabel: string | null;
  added: string[]; removed: string[]; moved: string[];
  formsAdded: string[]; formsRemoved: string[];
};

export type PinnedImpact = {
  active_visits: number;
  active_inspections: number;
  prior: { label: string; visits: number; inspections: number }[];
};

export type ImpactData = {
  pinned: PinnedImpact | null;
  referencing: ReferencingPackage[];
  diff: DefinitionDiff | null;
};

export type ImpactStrings = {
  title: string;
  pinnedTitle: string; pinnedNone: string; pinnedVisits: string; pinnedInspections: string;
  pinnedHint: string; pinnedUnavailable: string; priorLead: string; priorLine: string;
  refTitle: string; refNone: string; refShares: string;
  diffTitle: string; diffVsCurrent: string; diffIsCurrent: string; diffNoBaseline: string;
  added: string; removed: string; moved: string; formsAdded: string; formsRemoved: string; noChanges: string;
};

const fmt = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);

function CodeList({ label, codes, tone }: {
  label: string;
  codes: readonly string[];
  tone: StatusTone;
}) {
  if (codes.length === 0) return null;
  return (
    <div className={styles.codes}>
      <Text as="span" role="label" tone="secondary">{label}</Text>
      {codes.map(code => (
        <StatusPill key={code} ping={false} tone={tone}>
          <Mono tone="inherit">{code}</Mono>
        </StatusPill>
      ))}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.group}>
      <Text role="bodyStrong">{title}</Text>
      {children}
    </section>
  );
}

export default function ImpactPanel({ data, strings: s }: { data: ImpactData; strings: ImpactStrings }) {
  const { pinned, referencing, diff } = data;
  const diffEmpty = diff && !diff.isCurrentPublished
    && diff.added.length + diff.removed.length + diff.moved.length
      + diff.formsAdded.length + diff.formsRemoved.length === 0;

  return (
    <div aria-label={s.title} className={styles.panel} role="region">
      <Group title={s.pinnedTitle}>
        {pinned == null ? (
          <Text live="status" role="label" tone="warning">{s.pinnedUnavailable}</Text>
        ) : pinned.active_visits + pinned.active_inspections === 0 ? (
          <Text live="status" role="label" tone="success">{s.pinnedNone}</Text>
        ) : (
          <>
            <div className={styles.counts}>
              <StatusPill ping={false} tone="warning">
                {fmt(s.pinnedVisits, { n: pinned.active_visits })}
              </StatusPill>
              <StatusPill ping={false} tone="warning">
                {fmt(s.pinnedInspections, { n: pinned.active_inspections })}
              </StatusPill>
            </div>
            {pinned.prior.length > 0 ? (
              <>
                <Text role="label" tone="secondary">{s.priorLead}</Text>
                <ul className={styles.list}>
                  {pinned.prior.map(prior => (
                    <li key={prior.label}>
                      <Text as="span" role="label" tone="muted">
                        {fmt(s.priorLine, {
                          label: prior.label,
                          visits: prior.visits,
                          inspections: prior.inspections,
                        })}
                      </Text>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <Text role="label" tone="muted">{s.pinnedHint}</Text>
          </>
        )}
      </Group>

      <Group title={s.refTitle}>
        {referencing.length === 0 ? (
          <Text role="label" tone="muted">{s.refNone}</Text>
        ) : (
          <ul className={styles.list}>
            {referencing.map(reference => (
              <li className={styles.reference} key={`${reference.code}-${reference.label}`}>
                <Mono>{reference.code}</Mono>
                <Text as="span" role="label">{reference.title}</Text>
                <Text as="span" role="label" tone="muted">
                  {fmt(s.refShares, { n: reference.sharedItems.length })}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Group>

      <Group title={s.diffTitle}>
        {diff == null ? <Text role="label" tone="muted">{s.diffNoBaseline}</Text> : null}
        {diff?.isCurrentPublished ? <Text role="label" tone="muted">{s.diffIsCurrent}</Text> : null}
        {diff && !diff.isCurrentPublished ? (
          <>
            <Text role="label" tone="secondary">
              {fmt(s.diffVsCurrent, { label: diff.comparedLabel ?? "" })}
            </Text>
            {diffEmpty ? <Text role="label" tone="muted">{s.noChanges}</Text> : (
              <>
                <CodeList codes={diff.added} label={s.added} tone="success" />
                <CodeList codes={diff.removed} label={s.removed} tone="danger" />
                <CodeList codes={diff.moved} label={s.moved} tone="info" />
                <CodeList codes={diff.formsAdded} label={s.formsAdded} tone="success" />
                <CodeList codes={diff.formsRemoved} label={s.formsRemoved} tone="danger" />
              </>
            )}
          </>
        ) : null}
      </Group>
    </div>
  );
}
