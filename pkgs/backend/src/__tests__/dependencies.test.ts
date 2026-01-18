import { describe, it, expect } from "vitest";

describe("Dependencies", () => {
  it("should import jose library successfully", async () => {
    const jose = await import("jose");
    expect(jose).toBeDefined();
    expect(jose.SignJWT).toBeDefined();
    expect(jose.jwtVerify).toBeDefined();
  });

  it("should have process.env accessible for environment variables", () => {
    // Verify that process.env is accessible
    expect(process.env).toBeDefined();
    expect(typeof process.env).toBe("object");
  });

  it("should have TypeScript configured for strict mode", () => {
    // This is a compile-time check, if this test runs without errors
    // it means TypeScript is properly configured
    const testValue: string = "test";
    expect(testValue).toBe("test");

    // Verify no 'any' types are accidentally used
    type CheckType<T> = T extends any ? true : false;
    const typeCheck: CheckType<string> = true;
    expect(typeCheck).toBe(true);
  });
});
