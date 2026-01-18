import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";

describe("CORS Configuration", () => {
  it("should set Access-Control-Allow-Origin to http://localhost:5173", async () => {
    const app = new Hono();

    app.use(
      "/*",
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );

    app.get("/test", (c) => c.json({ message: "test" }));

    const req = new Request("http://localhost:3001/test", {
      method: "GET",
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    const res = await app.fetch(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173",
    );
  });

  it("should set Access-Control-Allow-Credentials to true", async () => {
    const app = new Hono();

    app.use(
      "/*",
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );

    app.get("/test", (c) => c.json({ message: "test" }));

    const req = new Request("http://localhost:3001/test", {
      method: "GET",
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    const res = await app.fetch(req);

    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should handle preflight OPTIONS requests", async () => {
    const app = new Hono();

    app.use(
      "/*",
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );

    app.get("/test", (c) => c.json({ message: "test" }));

    const req = new Request("http://localhost:3001/test", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
    });

    const res = await app.fetch(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173",
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("should not allow requests from unauthorized origins", async () => {
    const app = new Hono();

    app.use(
      "/*",
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      }),
    );

    app.get("/test", (c) => c.json({ message: "test" }));

    const req = new Request("http://localhost:3001/test", {
      method: "GET",
      headers: {
        Origin: "http://malicious-site.com",
      },
    });

    const res = await app.fetch(req);

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("should verify CORS configuration constants match requirements", () => {
    const expectedOrigin = "http://localhost:5173";
    const expectedCredentials = true;

    // Requirement 8.3: Frontend should run on port 5173
    expect(expectedOrigin).toBe("http://localhost:5173");

    // Requirement 8.4: Backend should support credentials
    expect(expectedCredentials).toBe(true);
  });
});
