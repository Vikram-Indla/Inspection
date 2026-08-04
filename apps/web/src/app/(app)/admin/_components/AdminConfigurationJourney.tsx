type ConfigurationStep = "regulations" | "templates" | "packages";

export type AdminConfigurationJourneyLabels = {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  regulations: string;
  templates: string;
  packages: string;
  current: string;
};

const STEPS: Array<{ id: ConfigurationStep; href: string }> = [
  { id: "regulations", href: "/admin/regulations" },
  { id: "templates", href: "/admin/templates" },
  { id: "packages", href: "/admin/packages" },
];

export default function AdminConfigurationJourney({
  current,
  labels,
}: {
  current: ConfigurationStep;
  labels: AdminConfigurationJourneyLabels;
}) {
  return (
    <nav className="panel stack" aria-label={labels.ariaLabel}>
      <div className="panel-body stack">
      <div className="row">
        <span className="badge badge-info">{labels.eyebrow}</span>
        <strong>{labels.title}</strong>
      </div>
      <p className="t-caption">{labels.description}</p>
      <div className="row">
        {STEPS.map((step, index) => {
          const isCurrent = step.id === current;
          return (
            <a
              key={step.id}
              className={`btn ${isCurrent ? "btn-primary" : "btn-secondary sq-link"} btn-touch`}
              href={step.href}
              aria-current={isCurrent ? "step" : undefined}
            >
              {index + 1}. {labels[step.id]}
              {isCurrent ? ` · ${labels.current}` : ""}
            </a>
          );
        })}
      </div>
      </div>
    </nav>
  );
}
