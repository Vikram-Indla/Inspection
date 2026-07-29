import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { isFieldReturnPath, safeFieldReturnPath } from "../src/lib/field-auth";
import {
  establishAuthenticatedThemeDefault,
  SAQEEL_THEME_STORAGE_KEY,
} from "../src/lib/theme-preference";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test.describe("TASK-IPAD-AUTH-SESSION-RECOVERY-001", () => {
  test("return routing is field-only", () => {
    expect(safeFieldReturnPath("/field/inspection/a?tab=evidence")).toBe("/field/inspection/a?tab=evidence");
    expect(isFieldReturnPath("/field/inspection/a?tab=evidence")).toBe(true);
    for (const unsafe of ["/field/../admin", "//example.com/field", "https://example.com/field", "/planning"]) {
      expect(safeFieldReturnPath(unsafe)).toBe("/field");
      expect(isFieldReturnPath(unsafe)).toBe(false);
    }
  });

  test("login verifies Inspector role before remembering or returning", () => {
    const auth = read("src/lib/field-auth.ts");
    const login = read("src/app/login/field/FieldLoginClient.tsx");
    expect(auth).toContain('.eq("user_id", userId).eq("role_key", "inspector")');
    expect(login).toContain("authorizeInspectorLogin");
    expect(login).toContain("await supabaseBrowser().auth.signOut()");
    expect(login).toContain("if (!isFieldRecovery)");
    expect(login).toContain("if (isFieldRecovery)");
    expect(login).toContain("safeFieldReturnPath(returnTo)");
    expect(login).toContain("window.location.assign(safeReturnTo)");
    expect(login).toContain('window.location.assign("/launch")');
  });

  test("successful authentication defaults to dark without overwriting an explicit choice", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(establishAuthenticatedThemeDefault(storage)).toBe("dark");
    expect(values.get(SAQEEL_THEME_STORAGE_KEY)).toBe("dark");

    values.set(SAQEEL_THEME_STORAGE_KEY, "light");
    expect(establishAuthenticatedThemeDefault(storage)).toBe("light");
    expect(values.get(SAQEEL_THEME_STORAGE_KEY)).toBe("light");

    const login = read("src/app/login/field/FieldLoginClient.tsx");
    expect(login).toContain("establishAuthenticatedThemeDefault(window.localStorage)");
    expect(login.indexOf("establishAuthenticatedThemeDefault(window.localStorage)"))
      .toBeLessThan(login.indexOf('window.location.assign("/launch")'));
  });

  test("bootstrap refreshes expiry and allows offline only for a known valid Inspector", () => {
    const auth = read("src/lib/field-auth.ts");
    expect(auth).toContain("sb.auth.refreshSession()");
    expect(auth).toContain('status: "offline_known"');
    expect(auth).toContain("isKnownInspector(userId)");
    expect(auth).toContain('status: "expired"');
  });

  test("field layout denies anonymous and non-Inspector access before child reads", () => {
    const layout = read("src/app/(app)/field/layout.tsx");
    expect(layout).toContain("getVerifiedUser(sb)");
    expect(layout).toContain('roleKeys.includes("inspector")');
    expect(layout).toContain("/login?reason=expired");
    expect(layout).toContain("/login?reason=unauthorized");
    expect(layout).toContain("next=${encodeURIComponent(pathname)}");
  });

  test("open screens recover on sign-out or token refresh with intended path", () => {
    const boundary = read("src/components/field/FieldSessionBoundary.tsx");
    expect(boundary).toContain('event === "SIGNED_OUT"');
    expect(boundary).toContain('event === "TOKEN_REFRESHED"');
    expect(boundary).toContain("window.location.pathname");
    expect(boundary).toContain("encodeURIComponent(intended)");
  });

  test("field logout separates the active device user", () => {
    const logout = read("src/app/login/field/logout/FieldLogoutClient.tsx");
    expect(logout).toContain("clearFieldSessionIdentity(userId)");
    expect(logout).toContain("clearBiometricUnlock(userId)");
    expect(logout).toContain("await sb.auth.signOut()");
    expect(logout).toContain('window.location.replace("/login?reason=signedout")');
    expect(read("src/app/(app)/field/account/page.tsx")).toContain('href="/signout"');
  });
});
