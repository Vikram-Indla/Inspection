import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import Toolbar from "@/components/saqeel/toolbar/toolbar";

export type OperationsView = "map" | "performance";

export type OperationsToolbarStrings = {
  readonly label: string;
  readonly map: string;
  readonly performance: string;
  readonly livePositions: string;
  readonly exceptionBoard: string;
  readonly showList: string;
  readonly showMap: string;
};

export default function OperationsToolbar({
  view,
  onViewChange,
  showList,
  onToggleList,
  livePositionsHref,
  exceptionBoardHref,
  strings,
}: {
  view: OperationsView;
  onViewChange: (view: OperationsView) => void;
  showList: boolean;
  onToggleList: () => void;
  livePositionsHref: string;
  exceptionBoardHref: string;
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
        <>
          <Button variant="secondary" size="sm" href={livePositionsHref} label={strings.livePositions}>
            {strings.livePositions}
          </Button>
          <Button variant="secondary" size="sm" href={exceptionBoardHref} label={strings.exceptionBoard}>
            {strings.exceptionBoard}
          </Button>
          <Button
            variant="secondary" size="sm" onClick={onToggleList}
            expanded={showList} label={listLabel}
          >
            {listLabel}
          </Button>
        </>
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
