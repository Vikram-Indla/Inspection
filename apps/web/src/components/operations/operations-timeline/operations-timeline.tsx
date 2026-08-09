import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { SelectOption } from "@/components/saqeel/select/select";
import Stack from "@/components/saqeel/stack/stack";
import Timeline, { type TimelineEvent } from "@/components/saqeel/timeline/timeline";
import OperationsTimelinePicker, { type TimelinePickerStrings } from "./operations-timeline-picker";

export type TimelineStrings = TimelinePickerStrings & {
  readonly title: string;
  readonly description: string;
  readonly selectPrompt: string;
  readonly unavailableTitle: string;
  readonly unavailableBody: string;
  readonly emptyTitle: string;
};

export default function OperationsTimeline({
  options, selected, scope, events, unavailable, strings,
}: {
  options: readonly SelectOption[];
  selected: string;
  scope: Readonly<Record<string, string>>;
  events: readonly TimelineEvent[];
  unavailable: boolean;
  strings: TimelineStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-timeline">
      <CardHeader
        level="h2"
        titleId="operations-timeline"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        <Stack gap="loose">
          <OperationsTimelinePicker
            options={options}
            value={selected}
            scope={scope}
            strings={{ label: strings.label, placeholder: strings.placeholder, load: strings.load }}
          />
          {!selected ? (
            <EmptyState icon="search" title={strings.selectPrompt} />
          ) : unavailable ? (
            <EmptyState icon="risk" title={strings.unavailableTitle} description={strings.unavailableBody} />
          ) : events.length === 0 ? (
            <EmptyState icon="calendar" title={strings.emptyTitle} />
          ) : (
            <Timeline events={events} labelledBy="operations-timeline" />
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}
