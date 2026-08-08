import { type ReactNode } from "react";
import styles from "./timeline.module.css";

export type TimelineEvent = {
  readonly id: string;
  /** Machine-readable timestamp for <time datetime>. */
  readonly dateTime?: string;
  /** Formatted timestamp shown to the reader. */
  readonly time: string;
  readonly title: string;
  readonly detail?: ReactNode;
  readonly meta?: string;
};

export default function Timeline({ events, label, labelledBy }: {
  events: readonly TimelineEvent[];
  label?: string;
  labelledBy?: string;
}) {
  if (!events.length) return null;
  return (
    <ol className={styles.root} aria-label={label} aria-labelledby={labelledBy}>
      {events.map(event => (
        <li className={styles.item} key={event.id}>
          <span className={styles.rail} aria-hidden="true">
            <span className={styles.dot} />
          </span>
          <div className={styles.body}>
            <div className={styles.head}>
              <span className={styles.title} dir="auto">{event.title}</span>
              <time className={styles.time} dateTime={event.dateTime}>{event.time}</time>
            </div>
            {event.meta ? <span className={styles.meta}>{event.meta}</span> : null}
            {event.detail ? <div className={styles.detail}>{event.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
