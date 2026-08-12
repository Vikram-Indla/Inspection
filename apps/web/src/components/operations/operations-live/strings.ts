import type { LiveMapCardStrings } from "./live-map-card";
import type { LiveInspectorPanelStrings } from "./live-inspector-panel";

export type LiveOpsStrings = LiveMapCardStrings & LiveInspectorPanelStrings & {
  readonly loading: string;
  readonly enRoute: string;
  readonly active: string;
  readonly arrived: string;
  readonly totalsLabel: string;
  readonly noScope: string;
  readonly noPositions: string;
  readonly loadError: string;
  readonly retry: string;
  readonly providerFailed: string;
  readonly mapUnavailable: string;
  readonly mapboxNotConfigured: string;
  readonly mapAriaLabel: string;
  readonly wallboardExit: string;
  readonly dataIntegrity: string;
  readonly outOfScopeGeography: string;
  readonly partialSource: string;
  readonly factorySourceUnavailable: string;
};
