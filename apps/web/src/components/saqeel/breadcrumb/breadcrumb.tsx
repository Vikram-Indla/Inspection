import Link from "next/link";
import { Text } from "@/components/saqeel/type";
import styles from "./breadcrumb.module.css";

export type Crumb = {
  readonly label: string;
  /** Omit on the final crumb — the page you are already on is not a link. */
  readonly href?: string;
};

/**
 * Trail of ancestors for the current page.
 *
 * The last item is always rendered as the current page (`aria-current="page"`)
 * and never as a link, whether or not it carries an `href` — a link to the page
 * you are on is a control that does nothing.
 *
 * `label` names the landmark and has no default: a hardcoded "Breadcrumb" would
 * be an English literal in every locale (WEB-013).
 */
export default function Breadcrumb({ items, label }: {
  items: readonly Crumb[];
  label: string;
}) {
  if (!items.length) return null;

  return (
    <nav aria-label={label}>
      <ol className={styles.trail}>
        {items.map((crumb, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li
              aria-current={isCurrent ? "page" : undefined}
              className={styles.crumb}
              key={`${crumb.href ?? ""}${crumb.label}`}
            >
              {isCurrent || !crumb.href ? (
                <Text as="span" role="label" tone={isCurrent ? "secondary" : "muted"}>
                  {crumb.label}
                </Text>
              ) : (
                <Link className={styles.link} href={crumb.href} prefetch={false}>
                  <Text as="span" role="label" tone="inherit">{crumb.label}</Text>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
