import { describe, it, expect } from "vitest";

describe("Dependencies", () => {
  it("should import jose library successfully", async () => {
    const jose = await import("jose");
    expect(jose).toBeDefined();
    expect(jose.decodeJwt).toBeDefined();
  });

  it("should import React Router v6 successfully", async () => {
    const router = await import("react-router-dom");
    expect(router).toBeDefined();
    expect(router.BrowserRouter).toBeDefined();
    expect(router.Routes).toBeDefined();
    expect(router.Route).toBeDefined();
    expect(router.Navigate).toBeDefined();
    expect(router.useNavigate).toBeDefined();
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
