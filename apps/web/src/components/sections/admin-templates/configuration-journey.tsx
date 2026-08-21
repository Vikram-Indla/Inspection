import Link from "next/link";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Heading, Overline, Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import styles from "./admin-templates.module.css";

type ConfigurationStep = "regulations" | "templates" | "packages";

const STEPS: ReadonlyArray<{ id: ConfigurationStep; href: string }> = [
  { id: "regulations", href: "/admin/regulations" },
  { id: "templates", href: "/admin/templates" },
  { id: "packages", href: "/admin/packages" },
];

export default function ConfigurationJourney({ current, labels }: {
  current: ConfigurationStep;
  labels: Messages["adminTemplates"]["journey"];
}) {
  return (
    <Card as="section" labelledBy="config-journey">
      <CardBody gap="default">
        <Overline>{labels.eyebrow}</Overline>
        <Heading level={2} id="config-journey">{labels.title}</Heading>
        <Text as="p" tone="secondary">{labels.description}</Text>
        <nav className={styles.journeySteps} aria-label={labels.ariaLabel}>
          {STEPS.map((step, index) => {
            const isCurrent = step.id === current;
            return (
              <Link
                key={step.id}
                href={step.href}
                prefetch={false}
                className={styles.journeyStep}
                data-current={isCurrent ? "" : undefined}
                aria-current={isCurrent ? "step" : undefined}
              >
                <Text role="label" as="span">{`${index + 1}. ${labels[step.id]}`}</Text>
                {isCurrent ? <Text role="label" tone="muted" as="span">{labels.current}</Text> : null}
              </Link>
            );
          })}
        </nav>
      </CardBody>
    </Card>
  );
}
