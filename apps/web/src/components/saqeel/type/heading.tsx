import { type ElementType, type ReactNode } from "react";
import styles from "./type.module.css";
import { type TextTone } from "./text";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingVisual = "display" | "heading" | "subheading";

export type HeadingProps = {
  children: ReactNode;
  level: HeadingLevel;
  visual?: HeadingVisual;
  tone?: TextTone;
  balance?: boolean;
  id?: string;
};

const VISUAL_FOR_LEVEL: Record<HeadingLevel, HeadingVisual> = {
  1: "display",
  2: "heading",
  3: "subheading",
  4: "subheading",
  5: "subheading",
  6: "subheading",
};

export function Heading({
  children,
  level,
  visual,
  tone = "primary",
  balance = true,
  id,
}: HeadingProps) {
  const Root: ElementType = `h${level}`;
  return (
    <Root
      className={styles.heading}
      data-visual={visual ?? VISUAL_FOR_LEVEL[level]}
      data-tone={tone}
      data-balance={balance ? "" : undefined}
      id={id}
    >
      {children}
    </Root>
  );
}
