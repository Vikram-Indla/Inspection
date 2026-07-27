import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const middlewarePath = path.join(process.cwd(), "src", "middleware.ts");

test.describe("PLN-AUTH-RECOVERY-P1-007 — stale session recovery contract", () => {
  test("clears stale Supabase auth cookies and redirects protected pages to login", () => {
    const source = fs.readFileSync(middlewarePath, "utf8");

    expect(source).toContain('code === "refresh_token_not_found"');
    expect(source).toMatch(/invalid refresh token\|refresh token not found/i);
    expect(source).toContain('name.startsWith("sb-") && name.includes("-auth-token")');
    expect(source).toContain('response.cookies.set(name, "", { path: "/", maxAge: 0 })');
    expect(source).toContain('loginUrl.pathname = "/login"');
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
