import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { protectedRoutes } from "../routes/protected.routes.js";

describe("GET /api/protected", () => {
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

  it("should return protected data with user info for valid token", async () => {
    const app = new Hono();
    app.route("/api", protectedRoutes);

    const token = await createAccessToken();
    const res = await app.request("/api/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect(body.user).toEqual({
      id: "user-demo-001",
      username: "demo",
    });
    expect(typeof body.timestamp).toBe("number");
  });

  it("should return 401 when authorization header is missing", async () => {
    const app = new Hono();
    app.route("/api", protectedRoutes);

    const res = await app.request("/api/protected");

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authorization header is required" });
  });
});
