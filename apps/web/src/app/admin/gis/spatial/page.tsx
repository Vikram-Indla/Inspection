import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { CreateLayer } from "./CreateLayer";

// TASK-MVP2-M2-06-SPATIAL-GIS-001 · MVP2-REQ-0087..0108 · CD-045 (spatial_canvas_v1).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function SpatialPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_SPATIAL_CANVAS, MODES, "off") !== "on") {
    return (
      <Shell current="/admin/gis" title={t("gis.sp.title", "Spatial canvas")} context={<span className="ax-lozenge ax-lozenge--warning">CD-045 · REQ-0087</span>}>
        <NotYetBoundary title={t("gis.sp.title", "Spatial canvas")} consequence={t("gis.sp.off", "The spatial canvas is not enabled here. Mapbox provider is held.")}
          seam="FEATURE_SPATIAL_CANVAS=off + Mapbox held" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: layers, error: e1 }, { data: locs, error: e2 }] = await Promise.all([
    sb.from("gis_layers").select("id, layer_key, label, layer_type, active").order("created_at", { ascending: false }),
    sb.from("factory_locations").select("id, factory_id, source, geofence_radius_m").order("created_at", { ascending: false }).limit(50),
  ]);
  const error = e1 || e2;
  if (error) console.error("[gis spatial] load", error);
  return (
    <Shell current="/admin/gis" title={t("gis.sp.title", "Spatial canvas")} context={<span className="ax-lozenge ax-lozenge--info">CD-045 · REQ-0087..0108</span>}>
      <div className="ax-banner"><div><strong>{t("gis.sp.banner.title", "Layers & locations.")}</strong> {t("gis.sp.banner.body", "The authoritative factory pin stays GIS-admin-owned (FND-007); these are additive working layers. Geofence/accuracy use accepted engine_settings.gis values. Mapbox rendering is held.")}</div></div>
      <CreateLayer strings={{
        key: t("gis.sp.key", "Layer key"), label: t("gis.sp.label", "Label"), type: t("gis.sp.type", "Type"),
        create: t("gis.sp.create", "Create layer"), creating: t("gis.sp.creating", "Creating…"), created: t("gis.sp.created", "layer created"),
      }} />
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("gis.sp.error", "Couldn’t load spatial data. Nothing changed.")}</strong></div></div>}
      {!error && (layers ?? []).length === 0 && (locs ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🗺️</span>
          <h4>{t("gis.sp.empty.title", "No layers or working locations in scope")}</h4>
          <p className="ax-caption">{t("gis.sp.empty.body", "GIS layers and working factory locations appear here. Empty may also mean none are in your scope (RLS).")}</p></div></div>
      )}
      {(layers ?? []).map((l) => (
        <div key={l.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{l.label} <span className="ax-caption">· {l.layer_type}</span></h3>
            <span className={`ax-lozenge ${l.active ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{l.active ? "active" : "inactive"}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
