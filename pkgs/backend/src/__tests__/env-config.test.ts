import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Environment Configuration", () => {
  it("should have .env.example file in backend package", () => {
    const envExamplePath = join(process.cwd(), ".env.example");
    expect(existsSync(envExamplePath)).toBe(true);
  });

  it("should have JWT_SECRET placeholder in .env.example", () => {
    const envExamplePath = join(process.cwd(), ".env.example");
    const content = readFileSync(envExamplePath, "utf-8");
    expect(content).toContain("JWT_SECRET");
  });

  it("should have PORT configuration in .env.example", () => {
    const envExamplePath = join(process.cwd(), ".env.example");
    const content = readFileSync(envExamplePath, "utf-8");
    expect(content).toContain("PORT=3001");
  });

  it("should have JWT_SECRET with minimum length recommendation", () => {
    const envExamplePath = join(process.cwd(), ".env.example");
    const content = readFileSync(envExamplePath, "utf-8");
    // Check that the comment or value suggests at least 32 characters
    expect(content).toMatch(/minimum.*32.*characters/i);
  });

  it("should have proper section headers for organization", () => {
    const envExamplePath = join(process.cwd(), ".env.example");
    const content = readFileSync(envExamplePath, "utf-8");
    expect(content).toContain("# JWT Settings");
    expect(content).toContain("# Server Configuration");
  });
});
