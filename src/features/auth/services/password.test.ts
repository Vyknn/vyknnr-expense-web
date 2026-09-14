import { hashPassword, verifyPassword } from "./password";

describe("password service", () => {
  it("verifies the matching password", () => {
    const storedHash = hashPassword("secure-password-123");

    expect(storedHash).toMatch(/^scrypt:16384:8:1:[a-f0-9]+:[a-f0-9]+$/);
    expect(verifyPassword("secure-password-123", storedHash)).toBe(true);
  });

  it("rejects a different password", () => {
    const storedHash = hashPassword("secure-password-123");

    expect(verifyPassword("different-password-123", storedHash)).toBe(false);
  });

  it("rejects malformed or unsupported stored hashes", () => {
    expect(verifyPassword("secure-password-123", "not-a-password-hash")).toBe(false);
    expect(verifyPassword("secure-password-123", "scrypt:16384:8:1::")).toBe(false);
    expect(
      verifyPassword(
        "secure-password-123",
        "scrypt:32768:8:1:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      )
    ).toBe(false);
  });
});
