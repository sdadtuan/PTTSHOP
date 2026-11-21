import { describe, expect, it } from "vitest";
import { AdminCredentialsError, readAdminCredentials } from "@/lib/admin-credentials";

describe("readAdminCredentials", () => {
  it("reads email and password from the environment", () => {
    expect(
      readAdminCredentials({
        ADMIN_EMAIL: " Owner@Shop.VN ",
        ADMIN_PASSWORD: "long-enough",
      }),
    ).toEqual({ email: "owner@shop.vn", password: "long-enough" });
  });

  it("rejects a missing or short password", () => {
    expect(() => readAdminCredentials({ ADMIN_EMAIL: "a@b.co", ADMIN_PASSWORD: "short" })).toThrow(
      AdminCredentialsError,
    );
    expect(() => readAdminCredentials({ ADMIN_EMAIL: "not-an-email", ADMIN_PASSWORD: "long-enough" })).toThrow(
      AdminCredentialsError,
    );
  });
});
