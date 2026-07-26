export const PIXEL_WIDTHS = [834, 600, 390] as const;
export const PIXEL_LOCALES = [
  { locale: "en", direction: "ltr" },
  { locale: "ar", direction: "rtl" },
] as const;

export type PixelLocale = (typeof PIXEL_LOCALES)[number];
export type PixelWidth = (typeof PIXEL_WIDTHS)[number];

export interface RouteTargetCommon {
  // /login is the signed-out surface. Browsing it with an authenticated
  // storage state aborts the navigation, so the login card is measured in a
  // clean context. This proves the real screen, it does not relax anything.
  unauthenticated?: boolean;
  // A route that deliberately delegates elsewhere. /field/reports/[id] is a
  // one-line redirect to the governed /reports/inspection/[id] projection, so
  // the shipped surface an inspector actually sees lives at that path. The
  // allowance is per-target and explicit; an undeclared redirect still fails.
  allowRedirectTo?: string;
}

export type RouteTarget =
  | ({ kind: "static"; path: string; label: string } & RouteTargetCommon)
  | ({
      kind: "discover";
      seedPath: string;
      hrefPattern: string;
      label: string;
      // The field shell renders its tab bar in field/layout.tsx, so every page
      // carries /field/my-tasks, /field/establishments, /field/notifications and
      // /field/account anchors. A visit-shaped pattern such as ^/field/[^/]+$
      // matches those nav links too, and would silently measure the wrong route.
      // Excluding them keeps discovery honest rather than lucky.
      excludePattern?: string;
      // Some routes are reachable but never linked. /field/[visitId]/travel is
      // only ever entered from inside the visit, so the visit id is discovered
      // and the documented suffix appended. The route is still proven by
      // navigation; nothing is assumed to exist.
      suffix?: string;
      // Ordered intermediate hops. Some surfaces are only linked from inside
      // another record (the visit page links its own travel screen), so the
      // harness walks the real user path instead of guessing an identifier.
      via?: { hrefPattern: string; excludePattern?: string }[];
    } & RouteTargetCommon);

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
