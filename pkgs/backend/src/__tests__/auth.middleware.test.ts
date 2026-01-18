import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { authMiddleware } from "../middleware/auth.middleware.js";

describe("Auth Middleware", () => {
  const jwtSecret = "test-secret-key-minimum-32-characters-long-for-security";

  beforeAll(() => {
    process.env.JWT_SECRET = jwtSecret;
  });

  const createAccessToken = async () => {
    const now = Math.floor(Date.now() / 1000);
    const secret = new TextEncoder().encode(jwtSecret);

    return new SignJWT({
      sub: "user-demo-001",
      username: "demo",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .sign(secret);
  };

  it("should return 401 when authorization header is missing", async () => {
    const app = new Hono();
    app.use("/protected", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const res = await app.request("/protected");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authorization header is required" });
  });

  it("should return 401 for invalid authorization header format", async () => {
    const app = new Hono();
    app.use("/protected", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const res = await app.request("/protected", {
      headers: {
        Authorization: "Token invalid",
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid authorization header" });
  });

  it("should return 401 for invalid access token", async () => {
    const app = new Hono();
    app.use("/protected", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const res = await app.request("/protected", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid access token" });
  });

  it("should set user info in context for valid token", async () => {
    const app = new Hono<{
      Variables: { user: import("../types/auth.types.js").JWTPayload };
    }>();
    app.use("/protected", authMiddleware);
    app.get("/protected", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const token = await createAccessToken();
    const res = await app.request("/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({
      sub: "user-demo-001",
      username: "demo",
    });
    expect(typeof body.user.exp).toBe("number");
    expect(typeof body.user.iat).toBe("number");
  });
});
