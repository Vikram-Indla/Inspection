// String contract for the SAQEEL Field Trusted Devices route.
//
// Built on the server in page.tsx through the repo's i18n pattern
// (`t(key, englishSource)`, with a reviewed Arabic fallback until the governed
// `ui_strings` catalogue carries these keys) and passed into the client as
// data. The client component holds no literal copy of its own.
export type TrustedDevicesStrings = {
  intro: string;
  loading: string;
  thisDevice: string;
  lastAuth: string;
  enrolled: string;

  // Trust-state badge labels — one per real backend state. No state is ever
  // rendered as a raw database enum.
  stChecking: string;
  stNotEnrolled: string;
  stCollision: string;
  stSignedOut: string;
  stInvalidId: string;
  stUnavailable: string;
  stPolicyPending: string;
  stPending: string;
  stTrusted: string;
  stSuspended: string;
  stRevoked: string;
  stWipePending: string;
  stWiped: string;

  // Trust-state explanations.
  dtChecking: string;
  dtNotEnrolled: string;
  dtCollision: string;
  dtSignedOut: string;
  dtInvalidId: string;
  dtUnavailable: string;
  dtPolicyPending: string;
  dtPending: string;
  dtPendingRegistered: string;
  dtTrusted: string;
  dtTrustedRegistered: string;
  dtUntrusted: string;

  enroll: string;
  enrolling: string;
  enrollBlocked: string;

  bioTitle: string;
  bioOn: string;
  bioOff: string;
  bioEnable: string;
  bioEnabling: string;
  bioDisable: string;
  bioError: string;

  // Availability reasons — every one of these is a fail-closed state in which
  // the control is disabled.
  bioChecking: string;
  bioInsecure: string;
  bioUnsupported: string;
  bioDeviceUntrusted: string;
  bioReady: string;
  bioActive: string;
  bioActiveInactive: string;

  bioScopeNote: string;
  registerNote: string;
};
