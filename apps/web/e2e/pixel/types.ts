export const PIXEL_WIDTHS = [834, 600, 390] as const;
export const PIXEL_LOCALES = [
  { locale: "en", direction: "ltr" },
  { locale: "ar", direction: "rtl" },
] as const;

export type PixelLocale = (typeof PIXEL_LOCALES)[number];
export type PixelWidth = (typeof PIXEL_WIDTHS)[number];

export type RouteTarget =
  | { kind: "static"; path: string; label: string }
  | {
      kind: "discover";
      seedPath: string;
      hrefPattern: string;
      label: string;
    };

export interface ManifestCard {
  cardId: string;
  cardName: string;
  routeJoinKey: string;
  routeTargets: RouteTarget[];
  designPages: string[];
  manifestIssues: string[];
}

export interface MetricSample {
  name: string;
  applicable: boolean;
  value: number | string | number[] | null;
  evidence: string;
}

export interface GeometrySnapshot {
  url: string;
  title: string;
  width: number;
  height: number;
  locale: string;
  direction: string;
  bodyScrollWidth: number;
  bodyClientWidth: number;
  unresolvedTemplateCount: number;
  runtimeErrorCount: number;
  metrics: MetricSample[];
}

export interface StructuralAssertion {
  metric: string;
  passed: boolean;
  applicable: boolean;
  shipped: number | string | number[] | null;
  design: number | string | number[] | null;
  rule: string;
}

export interface VariantResult {
  width: number;
  locale: string;
  direction: string;
  routePath: string;
  designPage: string;
  status: "measured" | "unmeasurable";
  reason?: string;
  assertions: StructuralAssertion[];
  structuralScore: number | null;
  bitmapDifferencePercent: number | null;
  shippedScreenshot?: string;
  designScreenshot?: string;
}

export interface CardReport {
  schemaVersion: 1;
  harness: "BS-1";
  cardId: string;
  cardName: string;
  routeJoinKey: string;
  generatedAt: string;
  rule: string;
  score: number | null;
  scoreReason: string;
  designPages: string[];
  routePaths: string[];
  variants: VariantResult[];
}
