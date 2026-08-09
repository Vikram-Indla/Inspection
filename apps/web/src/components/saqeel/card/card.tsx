import { type ReactNode } from "react";
import styles from "./card.module.css";

type CardElement = "article" | "section" | "div";

type CardProps = {
  children: ReactNode;
  as?: CardElement;
  interactive?: boolean;
  accent?: "ai";
  labelledBy?: string;
  role?: string;
};

type CardHeaderProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  titleId?: string;
  trailing?: ReactNode;
  level?: "h2" | "h3";
};

export function Card({ children, as = "article", interactive, accent, labelledBy, role }: CardProps) {
  const Root = as;
  return (
    <Root
      className={styles.root}
      data-interactive={interactive ? "" : undefined}
      data-accent={accent}
      aria-labelledby={labelledBy}
      role={role}
    >
      {children}
    </Root>
  );
}

export function CardHeader({ title, eyebrow, description, titleId, trailing, level = "h3" }: CardHeaderProps) {
  const Heading = level;
  return (
    <header className={styles.header}>
      <div className={styles.headline}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <Heading className={styles.title} id={titleId}>{title}</Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </header>
  );
}

export function CardBody({ children, gap = "default" }: {
  children: ReactNode;
  gap?: "tight" | "default" | "loose";
}) {
  return <div className={styles.body} data-gap={gap}>{children}</div>;
}

export function CardMedia({ children, height = "md", label }: {
  children: ReactNode;
  height?: "sm" | "md" | "lg";
  label?: string;
}) {
  return (
    <div className={styles.media} data-height={height} role={label ? "region" : undefined} aria-label={label}>
      {children}
    </div>
  );
}

export function CardFooter({ children, align = "start" }: {
  children: ReactNode;
  align?: "start" | "between" | "end";
}) {
  return <footer className={styles.footer} data-align={align}>{children}</footer>;
}

export function CardValueSlot({ children }: { children: ReactNode }) {
  return <div className={styles.valueSlot}>{children}</div>;
}

export function CardValue({ children, kind = "number", size = "lg" }: {
  children: ReactNode;
  kind?: "number" | "text";
  size?: "md" | "lg";
}) {
  return <strong className={styles.value} data-kind={kind} data-size={size}>{children}</strong>;
}

export function CardGrid({ children, min = "md" }: {
  children: ReactNode;
  min?: "sm" | "md" | "lg";
}) {
  return <div className={styles.grid} data-min={min}>{children}</div>;
}
