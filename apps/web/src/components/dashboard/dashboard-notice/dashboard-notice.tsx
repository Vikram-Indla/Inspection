import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";

export default function DashboardNotice({ tone, pill, pillVariant = "pill", title, children, actions }: {
  tone: StatusTone;
  pill: string;
  pillVariant?: "pill" | "muted";
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card as="section" role="status">
      <CardHeader
        title={title}
        trailing={pillVariant === "muted"
          ? <Text as="span" tone="muted">{pill}</Text>
          : <StatusPill tone={tone} ping>{pill}</StatusPill>}
      />
      <CardBody gap="tight">
        {children}
        {actions}
      </CardBody>
    </Card>
  );
}
