import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/platform/auth/password";

describe("password hashing", () => {
  it("verifies the original password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("salts each hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);

    expect(a).not.toBe(b);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "bcrypt$1$2$3$a$b")).resolves.toBe(false);
  });
});
