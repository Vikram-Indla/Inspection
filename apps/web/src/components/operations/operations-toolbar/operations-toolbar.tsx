import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import Toolbar from "@/components/saqeel/toolbar/toolbar";

export type OperationsView = "map" | "performance";

export type OperationsToolbarStrings = {
  readonly label: string;
  readonly map: string;
  readonly performance: string;
  readonly showList: string;
  readonly showMap: string;
};

export default function OperationsToolbar({
  view,
  onViewChange,
  showList,
  onToggleList,
  strings,
}: {
  view: OperationsView;
  onViewChange: (view: OperationsView) => void;
  showList: boolean;
  onToggleList: () => void;
  strings: OperationsToolbarStrings;
}) {
  const items: SegmentedItem<OperationsView>[] = [
    { value: "map", label: strings.map },
    { value: "performance", label: strings.performance },
  ];
  const listLabel = showList ? strings.showMap : strings.showList;

  return (
    <Toolbar
      as="header"
      trailing={
        <Button
          variant="secondary" size="sm" onClick={onToggleList}
          expanded={showList} label={listLabel}
        >
          {listLabel}
        </Button>
      }
    >
      <SegmentedControl
        items={items}
        value={view}
        onChange={onViewChange}
        label={strings.label}
        tone="accent"
      />
    </Toolbar>
  );
}
