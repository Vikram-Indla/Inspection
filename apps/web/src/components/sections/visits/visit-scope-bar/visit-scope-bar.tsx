import Button from "@/components/saqeel/button/button";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import VisitViewNavigation, { type VisitBasePath } from "@/app/(app)/visits/VisitViewNavigation";
import styles from "./visit-scope-bar.module.css";

export default function VisitScopeBar({ basePath, planningHref, scope, strings }: {
  basePath: VisitBasePath;
  planningHref: string | null;
  scope: string;
  strings: {
    readonly aria: string;
    readonly viewsAria: string;
    readonly list: string;
    readonly calendar: string;
    readonly workload: string;
    readonly map: string;
    readonly planningLink: string;
  };
}) {
  return (
    <Toolbar as="header" label={strings.aria} trailing={<span className={styles.scope}>{scope}</span>}>
      <VisitViewNavigation
        basePath={basePath}
        active="list"
        ariaLabel={strings.viewsAria}
        labels={{ list: strings.list, calendar: strings.calendar, map: strings.map, workload: strings.workload }}
      />
      {planningHref ? (
        <Button variant="tertiary" href={planningHref}>{strings.planningLink}</Button>
      ) : null}
    </Toolbar>
  );
}
