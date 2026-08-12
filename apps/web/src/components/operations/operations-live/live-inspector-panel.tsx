import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { LiveInspector } from "@/app/(app)/operations/live/types";

export type LiveInspectorPanelStrings = {
  readonly activeList: string;
  readonly selectedInspector: string;
  readonly closeDetails: string;
  readonly inspectorName: string;
  readonly factoryName: string;
  readonly regionName: string;
  readonly operationalState: string;
  readonly since: string;
  readonly visitReference: string;
  readonly positionSourceField: string;
  readonly positionObservedField: string;
  readonly sourceNotRecorded: string;
  readonly openVisit: string;
  readonly recordedState: string;
  readonly unavailableState: string;
  readonly rejectedState: string;
};

const PROVENANCE_TONE: Record<LiveInspector["positionState"], StatusTone> = {
  recorded: "success",
  unavailable: "warning",
  rejected: "danger",
};

export function provenanceLabel(inspector: LiveInspector, s: LiveInspectorPanelStrings): string {
  return inspector.positionState === "recorded" ? s.recordedState
    : inspector.positionState === "rejected" ? s.rejectedState : s.unavailableState;
}

function InspectorDetails({ inspector, onClose, strings: s }: {
  inspector: LiveInspector;
  onClose: () => void;
  strings: LiveInspectorPanelStrings;
}) {
  return (
    <Card as="section" labelledBy="live-inspector-details-title">
      <CardHeader
        level="h3"
        titleId="live-inspector-details-title"
        title={s.selectedInspector}
        trailing={<IconButton icon="dismiss" label={s.closeDetails} onClick={onClose} size="sm" />}
      />
      <CardBody gap="tight">
        <div data-testid="live-inspector-details">
          <DefinitionList
            columns="two"
            items={[
              { label: s.inspectorName, value: <bdi dir="auto">{inspector.inspector}</bdi> },
              { label: s.factoryName, value: inspector.factoryName },
              { label: s.regionName, value: inspector.region },
              { label: s.operationalState, value: inspector.stateLabel },
              {
                label: s.since,
                value: inspector.sinceAt
                  ? <time dateTime={inspector.sinceAt}>{inspector.sinceLabel}</time>
                  : inspector.sinceLabel,
              },
              { label: s.visitReference, value: inspector.visitId },
              { label: s.positionSourceField, value: inspector.positionSourceLabel ?? s.sourceNotRecorded },
              {
                label: s.positionObservedField,
                value: inspector.positionObservedAt
                  ? <time dateTime={inspector.positionObservedAt}>{inspector.positionObservedLabel}</time>
                  : inspector.positionObservedLabel,
              },
            ]}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          href={`/visits/${inspector.visitId}`}
          label={s.openVisit}
        >
          {s.openVisit}
        </Button>
      </CardBody>
    </Card>
  );
}

export default function LiveInspectorPanel({
  inspectors,
  selectedId,
  selectedInspector,
  onSelect,
  onClear,
  emptyBody,
  strings: s,
}: {
  inspectors: readonly LiveInspector[];
  selectedId: string | null;
  selectedInspector: LiveInspector | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  emptyBody: string;
  strings: LiveInspectorPanelStrings;
}) {
  return (
    <Card as="section" labelledBy="live-inspector-list-title">
      <CardHeader
        level="h2"
        titleId="live-inspector-list-title"
        title={s.activeList}
        trailing={<StatusPill tone="neutral" ping={false}>{String(inspectors.length)}</StatusPill>}
      />
      <CardBody gap="tight">
        {selectedInspector
          ? <InspectorDetails inspector={selectedInspector} onClose={onClear} strings={s} />
          : null}
        {inspectors.length ? (
          <ListRows labelledBy="live-inspector-list-title">
            {inspectors.map(inspector => (
              <ListRow
                key={inspector.id}
                badge={
                  <StatusPill tone={PROVENANCE_TONE[inspector.positionState]} ping={false}>
                    {provenanceLabel(inspector, s)}
                  </StatusPill>
                }
                pressed={selectedId === inspector.id}
                onSelect={() => onSelect(inspector.id)}
                title={inspector.factoryName}
                description={
                  <>
                    {inspector.region} · <bdi dir="auto">{inspector.inspector}</bdi> · {inspector.stateLabel}
                    {" · "}
                    {s.since}{" "}
                    {inspector.sinceAt
                      ? <time data-live-since dateTime={inspector.sinceAt}>{inspector.sinceLabel}</time>
                      : inspector.sinceLabel}
                  </>
                }
              />
            ))}
          </ListRows>
        ) : (
          <EmptyState icon="visits" title={emptyBody} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}
