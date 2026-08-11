"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import VisitConfiguration, {
  type VisitConfigurationValue,
} from "@/components/sections/planning-single/visit-configuration/visit-configuration";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import type { ModeEligibility } from "@/features/planning-single/target";
import type { Locale } from "@/lib/i18n";
import type { PlanningInspectorOption, PlanningPackageOption } from "@/lib/planning/read-contract";

export default function ConfigurationCard({
  value, onChange, inspectors, packages, eligibility, strings, locale,
}: {
  value: VisitConfigurationValue;
  onChange: (next: VisitConfigurationValue) => void;
  inspectors: readonly PlanningInspectorOption[];
  packages: readonly PlanningPackageOption[];
  eligibility: ModeEligibility;
  strings: SingleVisitStrings;
  locale: Locale;
}) {
  return (
    <Card as="section" labelledBy="single-visit-config">
      <CardHeader
        level="h2"
        titleId="single-visit-config"
        eyebrow={strings.stepLabels.configure}
        title={strings.configStep}
      />
      <CardBody>
        <VisitConfiguration
          value={value}
          onChange={onChange}
          visitTypeOptions={[
            { value: "periodic", label: strings.typePeriodic },
            { value: "follow_up", label: strings.typeFollowUp },
            { value: "complaint", label: strings.typeComplaint },
          ]}
          inspectorOptions={inspectors.map(entry => ({ value: entry.user_id, label: entry.full_name }))}
          packages={packages.map(entry => ({
            id: entry.id,
            versionLabel: entry.version_label,
            code: entry.packages.code,
            title: entry.packages.title,
          }))}
          eligibility={eligibility}
          locale={locale === "ar" ? "ar" : "en"}
          strings={strings}
        />
      </CardBody>
    </Card>
  );
}
