import Link from "next/link";
import { Text } from "@/components/saqeel/type";
import type { VisitsCopy } from "@/features/field-visits/labels";
import styles from "./visits.module.css";

type View = "list" | "calendar" | "map";

const HREFS: Readonly<Record<View, string>> = {
  list: "/field/visits",
  calendar: "/field/visits/calendar",
  map: "/field/map",
};

export default function VisitViewsNav({ active, copy }: {
  active: "list" | "calendar";
  copy: VisitsCopy;
}) {
  const views: readonly View[] = ["list", "calendar", "map"];
  return (
    <nav className={styles.views} aria-label={copy.views.aria}>
      {views.map(view => (
        <Link
          key={view}
          href={HREFS[view]}
          aria-current={view === active ? "page" : undefined}
          className={`${styles.viewTab} ${view === active ? styles.viewTabActive : ""}`}
        >
          <Text role="label" as="span" tone={view === active ? "inherit" : "secondary"}>
            {copy.views[view]}
          </Text>
        </Link>
      ))}
    </nav>
  );
}
