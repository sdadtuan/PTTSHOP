import { describe, expect, it } from "vitest";
import { clearRateLimit } from "@/lib/rate-limit";
import {
  CREDENTIALS_FAIL_LIMIT,
  LOGIN_FAILURE_ERROR,
  credentialsEmailKey,
  credentialsResponseFailed,
  guardCredentialsCallback,
  isCredentialsCallback,
} from "@/lib/credentials-rate-limit";

function callbackRequest(ip: string, email = "person@example.com") {
  const body = new URLSearchParams({ email, password: "not-the-real-password" });
  return new Request("http://localhost/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": ip,
    },
    body,
  });
}

function failedLogin() {
  return Response.json({ error: "CredentialsSignin" }, { status: 200 });
}

describe("credentials callback rate limit", () => {
  it("recognises only the credentials callback", () => {
    expect(isCredentialsCallback("http://localhost/api/auth/callback/credentials", "POST")).toBe(true);
    expect(isCredentialsCallback("http://localhost/api/auth/callback/credentials", "GET")).toBe(false);
    expect(isCredentialsCallback("http://localhost/api/auth/session", "POST")).toBe(false);
  });

  it("ignores CSRF errors and successful responses", async () => {
    expect(
      await credentialsResponseFailed(Response.json({ error: "MissingCSRF" })),
    ).toBe(false);
    expect(await credentialsResponseFailed(Response.json({ url: "http://localhost/" }))).toBe(false);
    expect(await credentialsResponseFailed(Response.json({ error: "CredentialsSignin" }))).toBe(true);
  });

  it("blocks the callback after the failed-attempt limit", async () => {
    const ip = "203.0.113.10";
    clearRateLimit(`credentials-callback:${ip}`);
    clearRateLimit(credentialsEmailKey("person@example.com"));
    let calls = 0;
    const next = async () => {
      calls += 1;
      return failedLogin();
    };

    for (let i = 0; i < CREDENTIALS_FAIL_LIMIT; i += 1) {
      const res = await guardCredentialsCallback(callbackRequest(ip), next);
      expect(res.status).toBe(200);
    }

    const blocked = await guardCredentialsCallback(callbackRequest(ip), next);
    expect(blocked.status).toBe(429);
    expect(calls).toBe(CREDENTIALS_FAIL_LIMIT);
    const body = await blocked.json();
    expect(body.error).toBe(LOGIN_FAILURE_ERROR);
  });

  it("blocks the same email from another IP and keeps one error code", async () => {
    const email = "shared@example.com";
    clearRateLimit(credentialsEmailKey(email));
    clearRateLimit("credentials-callback:198.51.100.1");
    clearRateLimit("credentials-callback:198.51.100.2");
    let calls = 0;
    const next = async () => {
      calls += 1;
      return failedLogin();
    };

    for (let i = 0; i < CREDENTIALS_FAIL_LIMIT; i += 1) {
      await guardCredentialsCallback(callbackRequest("198.51.100.1", email), next);
    }

    const blocked = await guardCredentialsCallback(callbackRequest("198.51.100.2", email), next);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: LOGIN_FAILURE_ERROR });
    expect(calls).toBe(CREDENTIALS_FAIL_LIMIT);
  });
});
