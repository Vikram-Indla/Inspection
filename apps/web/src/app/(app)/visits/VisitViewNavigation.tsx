import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";

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

const ROUTES: Record<Exclude<VisitView, "list">, string> = {
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
  const href = (view: VisitView) => view === "list" ? basePath : `${basePath}${ROUTES[view]}`;
  const items: SegmentedItem<VisitView>[] = [
    { value: "list", label: labels.list, href: href("list") },
    { value: "calendar", label: labels.calendar, href: href("calendar") },
    { value: "map", label: labels.map, href: href("map") },
    { value: "workload", label: labels.workload, href: href("workload") },
  ];

  return <SegmentedControl items={items} value={active} label={ariaLabel} tone="accent" />;
}
