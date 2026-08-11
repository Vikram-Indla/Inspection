export type ImmediateFactory = {
  readonly id: string;
  readonly name: string;
  readonly factory_code: string;
  readonly cr_number: string;
  readonly license_number: string | null;
  readonly region: string | null;
  readonly city: string | null;
  readonly risk_band: string | null;
  readonly risk_score: number | null;
  readonly official_lat: number | null;
  readonly official_lng: number | null;
  readonly source_synced_at: string | null;
};

export type ImmediatePackage = {
  readonly id: string;
  readonly version_label: string;
  readonly packages: { readonly code: string; readonly title: string };
};

export type ImmediateInspector = {
  readonly user_id: string;
  readonly full_name: string;
};

export type VisitTypeOption = {
  readonly key: string;
  readonly label: string;
  readonly manualEntryAllowed: boolean;
  readonly attachmentRequired: boolean;
};

export type ManualReasonOption = {
  readonly key: string;
  readonly label: string;
};

export type FactoryHandoff = {
  readonly crNumber: string | null;
  readonly licenseNumber: string | null;
  readonly returnTo: string | null;
};

export type ActorMode = "planner" | "inspector";

export type ImmediatePlanningData = {
  readonly actorMode: ActorMode;
  readonly manualEntryAllowed: boolean;
  readonly factories: readonly ImmediateFactory[];
  readonly packages: readonly ImmediatePackage[];
  readonly inspectors: readonly ImmediateInspector[];
  readonly regionOptions: readonly string[];
  readonly cityOptions: readonly string[];
  readonly cityByRegion: Readonly<Record<string, readonly string[]>>;
  readonly visitTypes: readonly VisitTypeOption[];
  readonly manualReasons: readonly ManualReasonOption[];
  readonly actorName: string;
  readonly initialFactoryId: string | null;
  readonly handoff: FactoryHandoff;
};

export type ImmediatePlanningLoad =
  | { readonly kind: "unauthorized" }
  | { readonly kind: "ready"; readonly data: ImmediatePlanningData };
