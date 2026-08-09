import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { isInvalidRefreshToken } from "../src/lib/auth/refresh-token-error";

const middlewarePath = path.join(process.cwd(), "src", "middleware.ts");

test.describe("PLN-AUTH-RECOVERY-P1-007 — stale session recovery contract", () => {
  test("classifies the Supabase stale-refresh error variants", () => {
    expect(isInvalidRefreshToken({
      code: "refresh_token_not_found",
      message: "Invalid Refresh Token: Refresh Token Not Found",
    })).toBe(true);
    expect(isInvalidRefreshToken({
      code: "validation_failed",
      message: "Refresh token is not valid",
    })).toBe(true);
    expect(isInvalidRefreshToken({
      code: "validation_failed",
      message: "Invalid refresh token",
    })).toBe(true);
  });

  test("does not classify unrelated validation or authentication failures", () => {
    expect(isInvalidRefreshToken({
      code: "validation_failed",
      message: "Password is not valid",
    })).toBe(false);
    expect(isInvalidRefreshToken({
      code: "unexpected_failure",
      message: "Access token is not valid",
    })).toBe(false);
    expect(isInvalidRefreshToken(null)).toBe(false);
  });

  test("clears stale Supabase auth cookies and redirects protected pages to login", () => {
    const source = fs.readFileSync(middlewarePath, "utf8");

    expect(source).toContain("isInvalidRefreshToken(claimsError)");
    expect(source).toContain('name.startsWith("sb-") && name.includes("-auth-token")');
    expect(source).toContain('response.cookies.set(name, "", { path: "/", maxAge: 0 })');
    expect(source).toContain("loginUrl.pathname = `/${locale}/login`");
    expect(source).toContain('loginUrl.searchParams.set("reason", "expired")');
    expect(source).toContain('loginUrl.searchParams.set("next"');
  });

  test("does not weaken verified-claims authentication or redirect anonymous public pages", () => {
    const source = fs.readFileSync(middlewarePath, "utf8");

    expect(source).toContain("await supabase.auth.getClaims()");
    expect(source).not.toContain("supabase.auth.getUser()");
    expect(source).toContain('request.method === "GET" && isProtectedPage');
    expect(source).not.toContain('PROTECTED_PAGE_PREFIXES = ["/"]');
  });
});
