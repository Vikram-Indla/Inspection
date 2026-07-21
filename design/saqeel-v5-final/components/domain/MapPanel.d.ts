/** Map panel — official/observed pin provenance, geofence ring, provider abstraction chip (MVP1-FND-007, DEC-008). Simplified static ground; production generates a full SVG scene via astryx.js. */
export interface MapPanelProps {
  pins?: { x: string | number; y: string | number; kind?: "official" | "observed"; label?: React.ReactNode }[];
  geofence?: { x: string | number; y: string | number; r: number };
  chrome?: React.ReactNode;
  provider?: React.ReactNode;
  height?: number;
  className?: string;
}
export declare function MapPanel(props: MapPanelProps): JSX.Element;
