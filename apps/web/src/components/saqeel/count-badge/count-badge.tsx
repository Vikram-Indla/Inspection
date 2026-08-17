import styles from "./count-badge.module.css";

export type CountBadgeTone = "neutral" | "accent" | "danger";

export default function CountBadge({ value, tone = "neutral", label, superscript }: {
  value: number | string;
  tone?: CountBadgeTone;
  label?: string;
  superscript?: boolean;
}) {
  const Root = superscript ? "sup" : "span";
  return (
    <Root
      className={styles.root}
      data-tone={tone}
      data-superscript={superscript ? "" : undefined}
    >
      {value}
      {label ? <span className="sqx-visually-hidden">{` ${label}`}</span> : null}
    </Root>
  );
}
