import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { ManifestCard, RouteTarget } from "./types";

interface SpineCard {
  id: string;
  channel?: string;
  name: string;
  route?: string;
  designPage?: string;
}
interface Spine {
  cards: SpineCard[];
}

const WEB_ROOT = resolve(__dirname, "../..");
export const REPOSITORY_ROOT = resolve(WEB_ROOT, "../..");
export const SPINE_PATH = join(REPOSITORY_ROOT, "status", "saqeel-status.json");
export const DESIGNS_ROOT = join(REPOSITORY_ROOT, "designs", "pwa", "pwa");

// These targets are keyed by the spine's exact route field. The field remains
// the only code/design join key; card ids are labels and are never used to join.
// A visit id is a uuid. The field shell renders its tab bar from
// field/layout.tsx (CC-SHELL-TABLET-001), so /field/my-tasks, /field/establishments,
// /field/notifications and /field/account appear as anchors on every page. A
// loose ^/field/[^/]+$ therefore matches a nav link before it matches a visit,
// which measured the wrong route. Both guards below are deliberate.
const VISIT_HREF = "^/field/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
const FIELD_NAV_HREF =
  "^/field/(?:my-tasks|establishments|notifications|account|settings|drafts|reports|search|map|virtual|incident-reports|factory-360|feedback)(?:/|$)";

const ROUTES_BY_JOIN_KEY = new Map<string, RouteTarget[]>([
  [
    "web/src/app/(app)/field/layout.tsx · components/field/FieldNav.tsx · FieldHeader.tsx · field-home.module.css",
    [{ kind: "static", path: "/field", label: "field shell" }],
  ],
  [
    "components/field/FieldConnectivityBanner.tsx · FieldHeaderSync.tsx · FieldSyncChips.tsx · lib/offline.ts",
    [{ kind: "static", path: "/field", label: "dashboard header connectivity" }],
  ],
  [
    "web/src/app/(app)/field/page.tsx · components/field/FieldHome.tsx · DailyBriefingCard.tsx · FieldMetricStrip.tsx",
    [{ kind: "static", path: "/field", label: "field dashboard" }],
  ],
  [
    "web/src/app/(app)/field/my-tasks/page.tsx",
    [{ kind: "static", path: "/field/my-tasks", label: "my tasks" }],
  ],
  [
    "web/src/app/(app)/field/[visitId]/travel/* · field/map/page.tsx · FieldFullMap.tsx",
    [
      { kind: "static", path: "/field/map", label: "field map" },
      {
        // /field/my-tasks links the visit, and the visit page links its own
        // travel screen. Nothing links travel directly from the task list, so
        // the harness walks the real two-step path.
        kind: "discover",
        seedPath: "/field/my-tasks",
        via: [{ hrefPattern: VISIT_HREF, excludePattern: FIELD_NAV_HREF }],
        hrefPattern: "^/field/[^/]+/travel(?:/|$)",
        label: "assigned visit travel",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/establishments · field/factory-360 (+ [id]) · Factory360Offline.tsx",
    [
      { kind: "static", path: "/field/establishments", label: "establishments" },
      { kind: "static", path: "/field/factory-360", label: "factory 360 resolver" },
      {
        // /field/factory-360 is a resolver that redirects; it renders no
        // dossier links at all. /field/establishments is the surface that
        // lists them, and it already scopes itself to the clean factory set,
        // so the dossier reached here is clean by construction. The rendered
        // page is still checked by assertCleanFactories.
        kind: "discover",
        seedPath: "/field/establishments",
        hrefPattern: "^/field/factory-360/[^/]+$",
        label: "clean factory dossier",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/search/page.tsx",
    [{ kind: "static", path: "/field/search", label: "global search" }],
  ],
  [
    "web/src/app/(app)/field/notifications (+ [id])",
    [
      { kind: "static", path: "/field/notifications", label: "notifications" },
      {
        kind: "discover",
        seedPath: "/field/notifications",
        hrefPattern: "^/field/notifications/[^/]+$",
        label: "notification detail",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/account · field/settings (+ FieldSettingsClient.tsx)",
    [
      { kind: "static", path: "/field/account", label: "account" },
      { kind: "static", path: "/field/settings", label: "settings" },
    ],
  ],
  [
    "web/src/app/(app)/field/[visitId]/Startup.tsx · PreExecution.tsx · preparation-actions.ts · PreInspectionPackSheet.tsx",
    [
      {
        // Was ^/field/[^/]+(?:/startup|/preparation)?$, which matched the
        // shell's own /field/my-tasks nav anchor first and silently measured
        // the task list as if it were the visit startup screen.
        kind: "discover",
        seedPath: "/field/my-tasks",
        hrefPattern: VISIT_HREF,
        excludePattern: FIELD_NAV_HREF,
        label: "assigned visit startup",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/inspection/[id]/Workspace.tsx · runtime.ts · GatedRepeaterSection.tsx",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "inspection workspace",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/inspection/[id]/FactoryVerification.tsx · SignaturePad.tsx",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "factory verification state",
      },
    ],
  ],
  [
    "components/field/SamplesSection.tsx · SeizureSection.tsx · samplesSeizureStrings.ts",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "samples and seizure section",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/incident-reports/* (page, form, actions)",
    [{ kind: "static", path: "/field/incident-reports", label: "incident reports" }],
  ],
  [
    "field/inspection/[id]/Workspace.tsx · components/field/OcrEvidenceCapture.tsx · lib/providers/ocr-gemini.ts (in-form; no /field/ocr route)",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "in-form OCR state",
      },
    ],
  ],
  [
    "lib/providers/ocr-gemini.ts (no /field/ocr route)",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "in-form OCR state",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/reports/page.tsx · reports/[id]/page.tsx · reports.module.css",
    [
      { kind: "static", path: "/field/reports", label: "reports library" },
      {
        kind: "discover",
        seedPath: "/field/reports",
        hrefPattern: "^/field/reports/[^/]+$",
        // field/reports/[id] is a one-line redirect to the governed immutable
        // projection, so that page is the surface an inspector actually sees.
        // Declared per target: any other redirect still fails the variant.
        allowRedirectTo: "^/reports/inspection/[^/]+$",
        label: "submitted report detail",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/drafts · FieldDraftList.tsx · lib/offline.ts",
    [{ kind: "static", path: "/field/drafts", label: "drafts and outbox" }],
  ],
  [
    "web/src/app/(app)/field/settings/conflicts/* (page + ConflictResolutionClient.tsx)",
    [{ kind: "static", path: "/field/settings/conflicts", label: "conflict resolution" }],
  ],
  [
    "web/src/app/(app)/field/settings/devices/* · lib/field-biometric-unlock.ts",
    [{ kind: "static", path: "/field/settings/devices", label: "trusted devices" }],
  ],
  [
    "web/src/app/login/field/* (FieldLoginClient + field-login.css, rendered by /login)",
    // An authenticated session is bounced off /login, which aborted the
    // navigation. The sign-in screen is only real when signed out.
    [{ kind: "static", path: "/login", label: "field login", unauthenticated: true }],
  ],
  [
    "web/src/app/login/field/* (field-login.css, separate from console login)",
    [{
      kind: "static",
      path: "/login",
      label: "consolidated field login presentation",
      unauthenticated: true,
    }],
  ],
  [
    "/field/virtual · /field/virtual/[id]",
    [
      { kind: "static", path: "/field/virtual", label: "virtual visits" },
      {
        kind: "discover",
        seedPath: "/field/virtual",
        hrefPattern: "^/field/virtual/[^/]+$",
        label: "virtual session",
      },
    ],
  ],
  [
    "partially covered by field/inspection/[id] submit path",
    [
      {
        kind: "discover",
        // /field/my-tasks links visits, not inspections. /field/drafts is the
        // surface that links resumable /field/inspection/[id] workspaces.
        seedPath: "/field/drafts",
        hrefPattern: "^/field/inspection/[^/]+$",
        label: "inspection completion state",
      },
    ],
  ],
]);

function normalizeDesignName(value: string): string {
  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/^pwa\//, "")
    .trim();
}

function designCandidates(designPage: string): string[] {
  const available = existsSync(DESIGNS_ROOT)
    ? readdirSync(DESIGNS_ROOT).filter(file => file.endsWith(".dc.html"))
    : [];
  const parts = designPage.split("·").map(normalizeDesignName).filter(Boolean);
  const candidates: string[] = [];

  for (const part of parts) {
    if (part.endsWith(".js")) continue;
    const requested = part.endsWith(".dc.html")
      ? basename(part)
      : `SAQEEL PWA-Field ${part}.dc.html`;
    if (available.includes(requested)) {
      candidates.push(requested);
      continue;
    }
    const suffix = requested
      .replace(/^SAQEEL PWA-Field /, "")
      .replace(/\.dc\.html$/, "")
      .toLowerCase();
    const matches = available.filter(file =>
      file.toLowerCase().replace(/\.dc\.html$/, "").endsWith(suffix),
    );
    if (matches.length === 1) candidates.push(matches[0]);
  }
  return [...new Set(candidates)];
}

export function loadManifest(): ManifestCard[] {
  const spine = JSON.parse(readFileSync(SPINE_PATH, "utf8")) as Spine;
  return spine.cards
    .filter(card => card.channel === "pwa" && card.id !== "pwaref")
    .map(card => {
      const routeJoinKey = card.route?.trim() ?? "";
      const designPages = card.designPage ? designCandidates(card.designPage) : [];
      const routeTargets = ROUTES_BY_JOIN_KEY.get(routeJoinKey) ?? [];
      const manifestIssues: string[] = [];
      if (!routeJoinKey) manifestIssues.push("missing route join key");
      if (!routeTargets.length) manifestIssues.push(`no reachable route for spine route field: ${routeJoinKey || "<empty>"}`);
      if (!designPages.length) manifestIssues.push(`no renderable .dc.html resolved from: ${card.designPage ?? "<empty>"}`);
      return {
        cardId: card.id,
        cardName: card.name,
        routeJoinKey,
        routeTargets,
        designPages,
        manifestIssues,
      };
    });
}
