import { type ElementType, type ReactNode } from "react";
import styles from "./type.module.css";

export type TextTone =
  | "primary"
  | "secondary"
  | "muted"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "inverse"
  | "inherit";

export type TextRole = "body" | "bodyStrong" | "label" | "overline" | "mono";

export type TextAlign = "start" | "center" | "end";

export type TextElement =
  | "p"
  | "span"
  | "div"
  | "dt"
  | "dd"
  | "li"
  | "strong"
  | "em"
  | "code"
  | "time"
  | "figcaption"
  | "address";

export type TextProps = {
  children: ReactNode;
  role?: TextRole;
  tone?: TextTone;
  as?: TextElement;
  align?: TextAlign;
  numeric?: boolean;
  clamp?: 1 | 2 | 3;
  id?: string;
};

const DEFAULT_ELEMENT: Record<TextRole, TextElement> = {
  body: "p",
  bodyStrong: "p",
  label: "span",
  overline: "p",
  mono: "span",
};

export function Text({
  children,
  role = "body",
  tone = "primary",
  as,
  align,
  numeric,
  clamp,
  id,
}: TextProps) {
  const Root: ElementType = as ?? DEFAULT_ELEMENT[role];
  return (
    <Root
      className={styles.text}
      data-role={role}
      data-tone={tone}
      data-align={align}
      data-numeric={numeric ? "" : undefined}
      data-clamp={clamp}
      id={id}
    >
      {children}
    </Root>
  );
}

export type OverlineProps = {
  children: ReactNode;
  tone?: TextTone;
  as?: TextElement;
  id?: string;
};

export function Overline({ children, tone = "muted", as = "p", id }: OverlineProps) {
  return (
    <Text role="overline" tone={tone} as={as} id={id}>
      {children}
    </Text>
  );
}

export type MonoProps = {
  children: ReactNode;
  tone?: TextTone;
  as?: TextElement;
  id?: string;
};

export function Mono({ children, tone = "secondary", as = "span", id }: MonoProps) {
  return (
    <Text role="mono" tone={tone} as={as} numeric id={id}>
      {children}
    </Text>
  );
}
