import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import GisStudio, { type GisFactory, type GisSettings, type GisStrings } from "./GisStudio";
import EmptyState from "@/components/EmptyState";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";

export const dynamic = "force-dynamic";

// SCR-ADM-070 — GIS Studio (ENG-06 governed values · SB20 geofencing map · ENG-08)
// All copy flows through t() (SB19) — English in code, Arabic from ui_strings.
export default async function GisStudioPage() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [engRes, facRes] = await Promise.all([
    sb.from("engine_settings").select("settings, version_label").eq("engine", "gis").single(),
    sb.from("factories")
      .select("id, factory_code, name, city, region, official_lat, official_lng, risk_band, risk_score, geofence_radius_m")
      .order("name"),
  ]);
  if (engRes.error) logProviderError("admin gis settings read", engRes.error);
  if (facRes.error) logProviderError("admin gis factories read", facRes.error);
  const err = engRes.error || facRes.error;
  const s = (engRes.data?.settings ?? {}) as Record<string, unknown>;
  const factories = (facRes.data ?? []) as GisFactory[];
  const settingsRows: [string, string, string][] = [
    [t("gis.settings.gps", "GPS accuracy for check-in"), `≤ ${String(s?.gps_accuracy_checkin_max_m)} m`, "ERR-GEO-001 threshold"],
    [t("gis.settings.arrival", "Arrival detection radius"), `${String(s?.arrival_detection_radius_m)} m`, "STM-JRN-002"],
    [t("gis.settings.fence", "Geofence default radius"), `${String(s?.geofence_default_radius_m)} m (${t("gis.settings.fenceNote", "per-factory override on the map")})`, "STM-JRN-003"],
    [t("gis.settings.telemetry", "Telemetry interval"), `${String(s?.telemetry_interval_s)} s`, "ENG-06"],
    [t("gis.settings.deviation", "Route deviation alert"), JSON.stringify(s?.route_deviation), "SB14 step 5"],
    [t("gis.settings.retention", "Retention"), JSON.stringify(s?.retention), "FND-009 policy"],
  ];

  const strings: GisStrings = {
    loadingTitle: t("gis.loading.title", "Loading map"),
    loadingBody: t("gis.loading.body", "Preparing the KSA geofencing view (ENG-06)."),
    searchLabel: t("gis.search.label", "Search factories"),
    searchPlaceholder: t("gis.search.placeholder", "Search by name, code, city or region…"),
    filterRegionAll: t("gis.filter.regionAll", "All regions"),
    filterBandAll: t("gis.filter.bandAll", "All risk bands"),
    shownOf: t("gis.count.shown", "factories shown"),
    noResults: t("gis.count.noResults", "No factories match the current filters."),
    noCoords: t("gis.count.noCoords", "without coordinates (table only)"),
    selectTitle: t("gis.select.title", "Select a factory pin"),
    selectBody: t("gis.select.body", "Click any pin to review its official coordinates and govern its geofence radius (SB20)."),
    coordsLabel: t("gis.coords.label", "Official coordinates (GIS-Admin-owned, FND-007)"),
    coordsCaption: t("gis.coords.caption", "Field observation never overwrites the official pin."),
    radiusLabel: t("gis.radius.label", "Geofence radius (m) — SB20"),
    radiusHint: t("gis.radius.hint", "Tip: with this factory selected, click the map to set the fence edge at that point. Blank override falls back to the engine default"),
    save: t("gis.radius.save", "Save radius"),
    saving: t("gis.radius.saving", "Saving…"),
    saved: t("gis.radius.saved", "saved"),
    defaultsTitle: t("gis.defaults.title", "Engine defaults (ENG-06 · read-only)"),
    defaultsCheckin: t("gis.defaults.checkin", "Check-in accuracy"),
    defaultsArrival: t("gis.defaults.arrival", "Arrival detection"),
    defaultsFence: t("gis.defaults.fence", "Default geofence"),
    legendCaption: t("gis.legend.caption", "risk-band pin tones"),
    bandHigh: t("gis.band.high", "high"),
    bandMedium: t("gis.band.medium", "medium"),
    bandLow: t("gis.band.low", "low"),
    bandUnbanded: t("gis.band.unbanded", "unbanded"),
    thCode: t("gis.table.code", "Code"),
    thName: t("gis.table.name", "Factory"),
    thRegion: t("gis.table.region", "Region"),
    thCity: t("gis.table.city", "City"),
    thBand: t("gis.table.band", "Risk band"),
    thRadius: t("gis.table.radius", "Geofence radius"),
    thCoords: t("gis.table.coords", "Official coordinates"),
    radiusDefault: t("gis.table.radiusDefault", "default"),
  };

  return (
    <Shell current="/admin/gis" title={t("gis.title", "GIS Studio — geofencing")}
      context={<><span className="badge badge-info">SCR-ADM-070 · ENG-06 · SB20</span><span className="ax-version">{engRes.data?.version_label}</span></>}>
      <div className="stack" style={{ gap: "var(--space-6)" }}>
        <div className="ax-banner"><div><strong>{t("gis.banner.title", "GIS Studio.")}</strong> {t("gis.banner.body", "These governed values stamp every geo event (config version recorded with each check-in — EV-005). Official coordinates remain GIS-Admin-owned; field observation never overwrites them (FND-007). Per-factory geofence radii (SB20) are edited on the map below.")}</div></div>

        {err && (
          <div className="ax-banner ax-banner--critical" role="alert">
            <div><strong>{t("gis.error.title", "GIS data unavailable.")}</strong> {t("gis.error.body", NEUTRAL_LOAD_ERROR)}</div>
          </div>
        )}

        {!err && factories.length === 0 && (
          <EmptyState glyph="◎" title={t("gis.empty.title", "No factories registered")}
            body={t("gis.empty.body", "The factory registry is empty — geofences appear here once factories are synced (FND-007).")} />
        )}

        {!err && factories.length > 0 && (
          <GisStudio factories={factories} gis={s as GisSettings} strings={strings} />
        )}

        {!err && (
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th scope="col">{t("gis.settings.setting", "Setting")}</th><th scope="col">{t("gis.settings.value", "Value")}</th><th scope="col">{t("gis.settings.contract", "Contract")}</th></tr></thead>
            <tbody>{settingsRows.map(([k, v, c]) => <tr key={k}><td><strong>{k}</strong></td><td className="numeric" dir="ltr">{v}</td><td className="t-caption">{c}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </Shell>
  );
}
