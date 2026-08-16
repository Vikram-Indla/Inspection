import { type ReactNode } from "react";
import Breadcrumb, { type Crumb } from "@/components/saqeel/breadcrumb/breadcrumb";
import { Heading, Text } from "@/components/saqeel/type";
import styles from "./shell-page-frame.module.css";

export type ShellBreadcrumb = Crumb;

export default function ShellPageFrame({
  title, description, breadcrumbs, breadcrumbLabel, actions, children,
}: {
  title?: string;
  description?: string;
  breadcrumbs?: readonly ShellBreadcrumb[];
  breadcrumbLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.frame}>
      {title || breadcrumbs?.length ? (
        <div className={styles.frameHead}>
          {breadcrumbs?.length && breadcrumbLabel ? (
            <Breadcrumb items={breadcrumbs} label={breadcrumbLabel} />
          ) : null}
          {title ? (
            <div className={styles.titleRow}>
              <div className={styles.titleText}>
                <Heading level={1}>{title}</Heading>
                {description ? (
                  <p className={styles.description}>
                    <Text as="span" tone="secondary">{description}</Text>
                  </p>
                ) : null}
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
