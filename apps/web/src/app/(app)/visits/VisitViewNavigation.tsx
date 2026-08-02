export type VisitBasePath = "/visits" | "/planning";
export type VisitView = "list" | "calendar" | "map" | "workload";

type VisitViewNavigationProps = {
  basePath?: VisitBasePath;
  active: VisitView;
  ariaLabel: string;
  labels: {
    list: string;
    calendar: string;
    map: string;
    workload: string;
  };
};

const routes: Record<Exclude<VisitView, "list">, string> = {
  calendar: "/calendar",
  map: "/map",
  workload: "/workload",
};

export default function VisitViewNavigation({
  basePath = "/visits",
  active,
  ariaLabel,
  labels,
}: VisitViewNavigationProps) {
  const href = (view: VisitView) => view === "list" ? basePath : `${basePath}${routes[view]}`;
  const items: { view: VisitView; label: string }[] = [
    { view: "list", label: labels.list },
    { view: "calendar", label: labels.calendar },
    { view: "map", label: labels.map },
    { view: "workload", label: labels.workload },
  ];

  return (
    <nav className="row" role="group" aria-label={ariaLabel}>
      {items.map(item => (
        <a
          className={`sq-btn ${item.view === active ? "sq-btn--secondary" : "sq-btn--subtle"}`}
          href={href(item.view)}
          aria-current={item.view === active ? "page" : undefined}
          key={item.view}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
