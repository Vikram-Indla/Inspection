import type { FieldDiff } from "@/features/approvals/rows";
import styles from "./approval-field-diff.module.css";

export type ApprovalFieldDiffStrings = {
  readonly caption: string;
  readonly field: string;
  readonly current: string;
  readonly proposed: string;
  readonly changed: string;
  readonly absent: string;
  readonly created: string;
};

/**
 * Snapshot values are `unknown` from a jsonb column. Scalars print as text;
 * anything structured prints as formatted JSON inside a `<pre>` rather than a
 * single-line `JSON.stringify` squeezed into a table cell, which is how the
 * legacy screen rendered a nested object.
 */
function DiffValue({ value, absent }: { value: unknown; absent: string }) {
  if (value === null || value === undefined || value === "") {
    return <span className={styles.absent}>{absent}</span>;
  }
  if (typeof value === "object") {
    return <pre className={styles.json}>{JSON.stringify(value, null, 2)}</pre>;
  }
  return <span dir="auto">{String(value)}</span>;
}

export default function ApprovalFieldDiff({ diffs, isCreate, labelFor, strings }: {
  diffs: readonly FieldDiff[];
  isCreate: boolean;
  labelFor: (field: string) => string;
  strings: ApprovalFieldDiffStrings;
}) {
  if (!diffs.length) return null;

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{strings.caption}</caption>
        <thead>
          <tr>
            <th className={styles.head} scope="col">{strings.field}</th>
            <th className={styles.head} scope="col">{isCreate ? strings.created : strings.current}</th>
            <th className={styles.head} scope="col">{strings.proposed}</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map(diff => (
            <tr className={styles.row} key={diff.field} data-changed={diff.changed ? "" : undefined}>
              <th className={styles.rowHead} scope="row">
                {labelFor(diff.field)}
                {diff.changed ? <span className={styles.flag}>{strings.changed}</span> : null}
              </th>
              <td className={styles.cell}><DiffValue value={diff.current} absent={strings.absent} /></td>
              <td className={styles.cell}><DiffValue value={diff.proposed} absent={strings.absent} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
