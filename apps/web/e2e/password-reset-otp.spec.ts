import { test, expect, type Page } from "@playwright/test";

type RecordedCall = {
  kind: "recover" | "verify" | "update" | "user" | "logout" | "audit" | "unexpected";
  method: string;
  url: string;
  body: Record<string, unknown> | null;
};

const USER_ID = "11111111-2222-4333-8444-555555555555";
const EMAIL = "otp-user@example.com";

function jwtPart(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function stubSession() {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = [
    jwtPart({ alg: "HS256", typ: "JWT" }),
    jwtPart({
      aud: "authenticated",
      email: EMAIL,
      exp: now + 3600,
      iat: now,
      role: "authenticated",
      session_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      sub: USER_ID,
    }),
    "c3R1Yi1zaWduYXR1cmU",
  ].join(".");
  const user = {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: EMAIL,
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "stub-refresh-token",
    user,
  };
}

async function installSupabaseAuthStubs(page: Page) {
  const calls: RecordedCall[] = [];
  const session = stubSession();

  await page.route("**/auth/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : null;
    const method = request.method();

    if (url.pathname.endsWith("/recover")) {
      calls.push({ kind: "recover", method, url: request.url(), body });
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }
    if (url.pathname.endsWith("/verify")) {
      calls.push({ kind: "verify", method, url: request.url(), body });
      const valid = body?.email === EMAIL && body?.token === "123456" && body?.type === "recovery";
      await route.fulfill(valid
        ? { status: 200, contentType: "application/json", body: JSON.stringify(session) }
        : { status: 403, contentType: "application/json", body: JSON.stringify({ message: "invalid token" }) });
      return;
    }
    if (url.pathname.endsWith("/user") && method === "PUT") {
      calls.push({ kind: "update", method, url: request.url(), body });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
      return;
    }
    if (url.pathname.endsWith("/user") && method === "GET") {
      calls.push({ kind: "user", method, url: request.url(), body });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) });
      return;
    }
    if (url.pathname.endsWith("/logout")) {
      calls.push({ kind: "logout", method, url: request.url(), body });
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    calls.push({ kind: "unexpected", method, url: request.url(), body });
    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "unstubbed auth request" }) });
  });

  await page.route("**/rest/v1/rpc/log_auth_event", async route => {
    const request = route.request();
    calls.push({
      kind: "audit",
      method: request.method(),
      url: request.url(),
      body: request.postData() ? request.postDataJSON() as Record<string, unknown> : null,
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });

  return calls;
}

async function requestCode(page: Page, email: string) {
  await page.getByRole("button", { name: /Forgot your password\?/i }).click();
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: /Send reset code/i }).click();
  await expect(page.locator("#reset-otp")).toBeVisible();
}

test("CD-002 OTP recovery calls resetPasswordForEmail → verifyOtp(recovery) → updateUser", async ({ page }) => {
  const calls = await installSupabaseAuthStubs(page);
  await page.goto("/locale?set=en");

  await requestCode(page, EMAIL);
  await page.locator("#reset-otp").fill("123456");
  await page.getByRole("button", { name: /Verify code/i }).click();

  await page.waitForURL(url => url.pathname === "/reset");
  await expect(page.getByRole("heading", { name: /Set a new password/i })).toBeFocused();
  await page.locator("#pw").fill("Correct-Horse-Battery-2026!");
  await page.locator("#pw2").fill("Correct-Horse-Battery-2026!");
  await page.getByRole("button", { name: /Save new password/i }).click();

  await expect(page.getByText("Password updated", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Go to sign in/i })).toHaveAttribute("href", "/login");
  await expect.poll(() => calls.filter(call => call.kind === "audit").length).toBe(2);

  const recover = calls.find(call => call.kind === "recover");
  const verify = calls.find(call => call.kind === "verify");
  const update = calls.find(call => call.kind === "update");
  expect(recover?.body).toMatchObject({ email: EMAIL });
  expect(recover?.body).not.toHaveProperty("redirect_to");
  expect(new URL(recover!.url).searchParams.has("redirect_to")).toBe(false);
  expect(verify?.body).toMatchObject({ email: EMAIL, token: "123456", type: "recovery" });
  expect(update?.body).toMatchObject({ password: "Correct-Horse-Battery-2026!" });
  expect(calls.findIndex(call => call.kind === "recover")).toBeLessThan(calls.findIndex(call => call.kind === "verify"));
  expect(calls.findIndex(call => call.kind === "verify")).toBeLessThan(calls.findIndex(call => call.kind === "update"));
  expect(calls.filter(call => call.kind === "audit").map(call => call.body?.p_action).sort()).toEqual([
    "password_reset_completed",
    "password_reset_requested",
  ]);
  expect(calls.filter(call => call.kind === "audit").every(call => /^[a-f0-9]{64}$/.test(String(call.body?.p_email_hash)))).toBe(true);
  expect(calls.some(call => call.kind === "logout")).toBe(true);
  expect(calls.filter(call => call.kind === "unexpected")).toEqual([]);
});

test("CD-002 forgot-password remains anti-enumerating for known and unknown emails", async ({ page }) => {
  const calls = await installSupabaseAuthStubs(page);
  await page.goto("/locale?set=en");
  const neutralViews: string[] = [];

  for (const email of [EMAIL, "not-registered@example.com"]) {
    await requestCode(page, email);
    const card = page.locator('section[aria-label="Check your email"]');
    neutralViews.push(await card.innerText());
    await expect(card).toContainText("If an account exists for that address");
    await expect(card).not.toContainText(/account found|no account|not registered|unknown user/i);
    await page.getByRole("button", { name: /^Back$/i }).click();
  }

  expect(neutralViews[1]).toBe(neutralViews[0]);
  expect(calls.filter(call => call.kind === "recover").map(call => call.body?.email)).toEqual([
    EMAIL,
    "not-registered@example.com",
  ]);
});
