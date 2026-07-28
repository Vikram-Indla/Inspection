import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import styles from "./m6-library.module.css";

// WA-M6-AC-003..004 · SCR-WEB-613 — the "Route contract" footer and the header
// provenance strip from designs/web/export-saqeel-web/"SAQEEL M6 Compliance
// Control Plane.dc.html". The design renders this footer on EVERY M6 route
// unconditionally (it sits outside every <sc-if>), so all three library routes
// carry it: /admin/regulations, /admin/items, /admin/packages.
//
// Nothing here is invented. Every value is passed in from the route that owns
// it; anything with no approved source renders through the ungoverned marker.

export type RouteContractProps = {
  /** Acceptance id for the route, e.g. WA-M6-AC-003. */
  acceptanceId: string;
  /** Canonical repo route path. */
  routePath: string;
  /** Scoped read leg(s) the route actually performs. */
  read: string;
  /** Permission grant resolved server-side. */
  grant: string;
  /** Write rule in force on this route. */
  write: ReactNode;
};

/**
 * Header provenance strip — design header row 2. Rendered inside the Shell
 * `context` slot so it sits under the route title exactly as the design does.
 */
export async function RouteProvenance({
  acceptanceId,
  routePath,
  screenId,
  extra,
}: {
  acceptanceId: string;
  routePath: string;
  screenId: string;
  extra?: ReactNode;
}) {
  const { t } = await useT();
  return (
    <span className="row" style={{ gap: "10px", alignItems: "center", flexWrap: "wrap", inlineSize: "100%" }}>
      <span className="badge">{t("admin.m6.shellBadge", "r1 shell")}</span>
      <span className="badge badge-info">{acceptanceId}</span>
      <span className={styles.prov}>
        {t("admin.m6.routeLabel", "route")} <bdi dir="ltr">{routePath}</bdi> · <bdi dir="ltr">{screenId}</bdi>
      </span>
      {extra}
      <span className="grow" />
      <span className={styles.prov}>
        {t("admin.m6.rlsProvenance", "authorized compliance user · RLS zone scope applied server-side")}
      </span>
    </span>
  );
}

/**
 * Always-on route contract footer — design lines 530-541. The observable-states
 * row and the shell-scope row are contract facts of the M6 route family, not
 * per-route values, so they are stated here once.
 */
export default async function RouteContract({ acceptanceId, routePath, read, grant, write }: RouteContractProps) {
  const { t } = await useT();
  return (
    <section className="panel" style={{ padding: "18px" }} aria-labelledby={`m6-contract-${acceptanceId}`}>
      <div className="panel-header" style={{ padding: "0 0 12px" }}>
        <span className="panel-title" id={`m6-contract-${acceptanceId}`}>
          {t("admin.m6.contract.heading", "Route contract")} · {acceptanceId}
        </span>
      </div>
      <dl className={styles.contractList}>
        <dt className={styles.contractTerm}>{t("admin.m6.contract.route", "Route")}</dt>
        <dd className={styles.contractDef}><span className="id-code">{routePath}</span></dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.read", "Read")}</dt>
        <dd className={styles.contractDef}>
          <span className="id-code">{read}</span>
          {" — "}
          {t("admin.m6.contract.readRule", "RLS zone-scoped, server-paged")}
        </dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.grant", "Grant")}</dt>
        <dd className={styles.contractDef}><span className="id-code">{grant}</span></dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.write", "Write rule")}</dt>
        <dd className={styles.contractDef}>{write}</dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.states", "States observable")}</dt>
        <dd className={styles.contractDef}>
          {t(
            "admin.m6.contract.statesValue",
            "Ready · Loading · Empty · Error · Degraded · Denied · Conflict — read failure, permission denial and empty result stay distinct; none is simulated by copy alone",
          )}
        </dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.shellScope", "Shell scope")}</dt>
        <dd className={styles.contractDef}>
          <strong>{t("admin.m6.contract.shellScopeValue", "Date and region scope render disabled — “Not applicable”")}</strong>{" "}
          {t(
            "admin.m6.contract.shellScopeRule",
            "on every M6 route. shellScopeForRoute grants date+region only to /dashboard and region only to /operations*; every /admin route resolves to neither. Route filters live in the page body, never in shell chrome.",
          )}
        </dd>

        <dt className={styles.contractTerm}>{t("admin.m6.contract.unsourced", "Unsourced values")}</dt>
        <dd className={styles.contractDef}>
          {t("admin.m6.contract.unsourcedLead", "Rendered as")}{" "}
          <span className={styles.unset}>
            {t("admin.m6.notConfigured", "Not configured")} / {t("admin.m6.decisionRequired", "Decision required")}
          </span>{" "}
          {t(
            "admin.m6.contract.unsourcedRule",
            "— never filled with an invented number, threshold, period or legal rule",
          )}
        </dd>
      </dl>
    </section>
  );
}
