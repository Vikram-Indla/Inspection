import Link from "next/link";

export type RiskNavLabels = {
  label: string;
  studio: string;
  studioHint: string;
  models: string;
  modelsHint: string;
};

export function RiskSectionNav({
  current,
  labels,
}: {
  current: "/admin/risk" | "/admin/risk/models";
  labels: RiskNavLabels;
}) {
  const items = [
    { href: "/admin/risk" as const, title: labels.studio, hint: labels.studioHint },
    { href: "/admin/risk/models" as const, title: labels.models, hint: labels.modelsHint },
  ];

  return (
    <nav className="rk-section-nav" aria-label={labels.label}>
      {items.map((item) => {
        const active = current === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rk-section-nav__item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <strong>{item.title}</strong>
            <span>{item.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
