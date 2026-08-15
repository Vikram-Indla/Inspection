import { type CSSProperties } from "react";
import { Text } from "@/components/saqeel/type";
import styles from "./bar-cell.module.css";

type TrackStyle = CSSProperties & Record<"--sqx-bar-cell-fill", string>;

/**
 * A numeric table cell that carries its own magnitude behind the number.
 *
 * The bar is drawn with `aria-hidden`, because the number beside it is already
 * the data — announcing both would read the same fact twice. It is scaled
 * against `peak`, the largest value in the column, so the column compares
 * within itself and never implies a target nobody configured.
 *
 * There is no colour decision here: length carries the meaning, and the fill
 * takes the same validated slot `BarSeries` defaults to, so a bar inside a
 * table and a bar in a chart read as the same mark. A row the caller marks
 * `muted` drops to the de-emphasis grey, the same contract `BarSeries` uses.
 */
export default function BarCell({ value, display, peak, muted = false }: {
  value: number;
  display: string;
  peak: number;
  muted?: boolean;
}) {
  const filled = peak > 0 ? Math.max(0, Math.min(100, (value / peak) * 100)) : 0;

  return (
    <span className={styles.root}>
      <span
        className={styles.track}
        data-muted={muted ? "true" : undefined}
        aria-hidden="true"
        style={{ "--sqx-bar-cell-fill": `${filled}%` } as TrackStyle}
      >
        <span className={styles.fill} />
      </span>
      <Text as="span" role="bodyStrong" numeric>{display}</Text>
    </span>
  );
}
