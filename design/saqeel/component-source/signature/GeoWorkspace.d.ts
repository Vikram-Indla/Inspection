/** @startingPoint section="Signature" subtitle="Geospatial Command Workspace — SAQEEL's strongest signature" viewport="700x360" */
export interface GeoWorkspaceProps {
  /** the map engine mount (untinted; dark mode = dark basemap style, not overlay) */
  basemap?: any;
  toolbar?: any;
  layers?: Array<{ id: string; label: string; on?: boolean }>;
  onToggleLayer?: (id: string) => void;
  legendItems?: Array<{ label: string; tone?: string }>;
  /** selected-zone / selected-inspection MapPanel */
  contextPanel?: any;
  /** expandable operational Drawer */
  drawer?: any;
  zoom?: { onIn?: () => void; onOut?: () => void; onLocate?: () => void };
  state?: "ready" | "loading" | "empty" | "restricted";
}
