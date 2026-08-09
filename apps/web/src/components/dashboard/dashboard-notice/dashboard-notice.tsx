import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export default function DashboardNotice({ tone, pill, title, children, actions }: {
  tone: StatusTone;
  pill: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card as="section" role="status">
      <CardHeader
        title={title}
        trailing={<StatusPill tone={tone} ping>{pill}</StatusPill>}
      />
      <CardBody gap="tight">
        {children}
        {actions}
      </CardBody>
    </Card>
  );
}
