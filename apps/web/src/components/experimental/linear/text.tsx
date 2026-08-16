import type { ReactNode } from "react";
import styles from "./text.module.css";

export type LinearTextRole = "caption" | "body" | "bodyLg" | "mono";
export type LinearHeadingRole = "bodyLg" | "subheading" | "headingSm";
export type LinearTone = "default" | "strong" | "muted";
export type LinearWeight = "regular" | "medium" | "strong";
export type LinearHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const roleClass = {
  caption: styles.caption,
  body: styles.body,
  bodyLg: styles.bodyLg,
  subheading: styles.subheading,
  headingSm: styles.headingSm,
  mono: styles.mono,
} as const;

const toneClass = {
  default: styles.toneDefault,
  strong: styles.toneStrong,
  muted: styles.toneMuted,
} as const;

const weightClass = {
  regular: styles.regular,
  medium: styles.medium,
  strong: styles.strong,
} as const;

function join(...parts: readonly (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Text({ role = "body", tone = "default", weight = "regular", numeric = false, as = "p", id, children }: {
  role?: LinearTextRole;
  tone?: LinearTone;
  weight?: LinearWeight;
  numeric?: boolean;
  as?: "p" | "span" | "div" | "dd" | "dt" | "li";
  id?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag id={id} className={join(styles.text, roleClass[role], toneClass[tone], weightClass[weight], numeric && styles.numeric)}>
      {children}
    </Tag>
  );
}

export function Heading({ level, role = "subheading", tone = "strong", weight = "medium", id, children }: {
  level: LinearHeadingLevel;
  role?: LinearHeadingRole;
  tone?: LinearTone;
  weight?: LinearWeight;
  id?: string;
  children: ReactNode;
}) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={join(styles.text, roleClass[role], toneClass[tone], weightClass[weight])}>
      {children}
    </Tag>
  );
}
