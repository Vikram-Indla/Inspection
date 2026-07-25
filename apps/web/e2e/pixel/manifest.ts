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
        kind: "discover",
        seedPath: "/field/my-tasks",
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
        kind: "discover",
        seedPath: "/field/factory-360",
        hrefPattern: "^/field/factory-360/F-(?:110[1-5]|220[1-5]|330[1-5]|440[1-2]|550[1-2]|660[1-2])$",
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
        kind: "discover",
        seedPath: "/field/my-tasks",
        hrefPattern: "^/field/[^/]+(?:/startup|/preparation)?$",
        label: "assigned visit startup",
      },
    ],
  ],
  [
    "web/src/app/(app)/field/inspection/[id]/Workspace.tsx · runtime.ts · GatedRepeaterSection.tsx",
    [
      {
        kind: "discover",
        seedPath: "/field/my-tasks",
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
        seedPath: "/field/my-tasks",
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
        seedPath: "/field/my-tasks",
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
        seedPath: "/field/my-tasks",
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
        seedPath: "/field/my-tasks",
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
    [{ kind: "static", path: "/login", label: "field login" }],
  ],
  [
    "web/src/app/login/field/* (field-login.css, separate from console login)",
    [{ kind: "static", path: "/login", label: "consolidated field login presentation" }],
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
        seedPath: "/field/my-tasks",
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
