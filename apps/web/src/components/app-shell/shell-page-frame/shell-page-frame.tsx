import Link from "next/link";
import { type ReactNode } from "react";
import styles from "./shell-page-frame.module.css";

export type ShellBreadcrumb = {
  readonly label: string;
  readonly href?: string;
};

export default function ShellPageFrame({ title, description, breadcrumbs, actions, children }: {
  title?: string;
  description?: string;
  breadcrumbs?: readonly ShellBreadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.frame}>
      {title || breadcrumbs?.length ? (
        <div className={styles.frameHead}>
          {breadcrumbs?.length ? (
            <ol className={styles.breadcrumb}>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href ?? crumb.label}
                  aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>
                  {crumb.href && index < breadcrumbs.length - 1
                    ? <Link href={crumb.href} data-next-spa="true">{crumb.label}</Link>
                    : <span>{crumb.label}</span>}
                </li>
              ))}
            </ol>
          ) : null}
          {title ? (
            <div className={styles.titleRow}>
              <div className={styles.titleText}>
                <h1 className={styles.title}>{title}</h1>
                {description ? <p className={styles.description}>{description}</p> : null}
              </div>
              {actions ? <div className={styles.frameActions}>{actions}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={styles.frameContent}>{children}</div>
    </div>
  );
}
