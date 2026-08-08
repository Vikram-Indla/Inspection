import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";

export type ExportSectionStrings = {
  readonly title: string;
  readonly description: string;
  readonly unauthorizedTitle: string;
};

export default function OperationsExport({ authorized, children, strings }: {
  authorized: boolean;
  children: ReactNode;
  strings: ExportSectionStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-export">
      <CardHeader
        level="h2"
        titleId="operations-export"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        {authorized ? children : <EmptyState icon="restricted" title={strings.unauthorizedTitle} />}
      </CardBody>
    </Card>
  );
}
