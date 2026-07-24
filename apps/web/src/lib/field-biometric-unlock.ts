// Local biometric UNLOCK opt-in — deliberately separate from device TRUST.
//
// Device trust (`readFieldDeviceEnrollment` / `selfEnrollFieldDevice` in
// app/(app)/field/settings/actions.ts) is the real, backend-authoritative
// maker-checker: a row in the server device register, approved by Operations.
// Nothing here may assert or infer that trust — it never was and never will be
// client-side (see TrustedDevicesClient's own contract note).
//
// This module governs a narrower, purely local thing: once a device already
// carries backend trust, does THIS browser also hold a platform-authenticator
// credential the user opted into, so Face ID/Touch ID can gate access to an
// EXISTING signed-in session instead of retyping a password? That opt-in
// record never proves identity by itself and is never sent to a server; it is
// a client convenience flag plus a WebAuthn credential id used only for a
// local `navigator.credentials.get()` ceremony.
//
// Enrollment lives in Settings > Security > Trusted Devices, and is offered
// only once the backend register reports this exact device as `trusted` — see
// TrustedDevicesClient. Nothing on the login screen can create this record.

const KEY_PREFIX = "saqeel.field.bioUnlock.v1.";

export type BiometricUnlockRecord = {
  credentialId: string; // base64url, WebAuthn credential.id
  enrolledAt: string;
};

function key(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function readBiometricUnlock(userId: string): BiometricUnlockRecord | null {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BiometricUnlockRecord>;
    return parsed.credentialId && parsed.enrolledAt ? (parsed as BiometricUnlockRecord) : null;
  } catch {
    return null;
  }
}

export function clearBiometricUnlock(userId: string): void {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    /* private mode */
  }
}

export async function platformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0)).buffer as ArrayBuffer;
}

/**
 * Creates a local platform-authenticator credential and records the opt-in.
 * Caller must already have confirmed this device is backend-trusted — this
 * function does not check that, so it must not be reachable from anywhere
 * that hasn't (currently: only the Trusted Devices settings screen).
 */
export async function enrollBiometricUnlock(userId: string, userLabel: string): Promise<BiometricUnlockRecord> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "SAQEEL Field" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: userLabel,
        displayName: userLabel,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No credential returned");

  const record: BiometricUnlockRecord = {
    credentialId: toBase64Url(credential.rawId),
    enrolledAt: new Date().toISOString(),
  };
  window.localStorage.setItem(key(userId), JSON.stringify(record));
  return record;
}

/** Runs the local Face ID/Touch ID ceremony. Never contacts a server. */
export async function unlockWithBiometric(record: BiometricUnlockRecord): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: fromBase64Url(record.credentialId), type: "public-key", transports: ["internal"] }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return assertion != null;
  } catch {
    return false;
  }
}
