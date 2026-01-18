import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { decodeJwt, SignJWT } from "jose";
import { authRoutes } from "../routes/auth.routes.js";
import { errorHandler } from "../middleware/error-handler.js";

describe("POST /auth/login", () => {
  let app: Hono;

  beforeAll(() => {
    // Set JWT_SECRET for AuthService
    process.env.JWT_SECRET =
      "test-secret-key-minimum-32-characters-long-for-security";

    app = new Hono();
    app.onError(errorHandler);
    app.route("/auth", authRoutes);
  });

  describe("Successful Login", () => {
    it("should return 200 with access token and user info for valid credentials", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("accessToken");
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("username");
      expect(body.user.username).toBe("demo");
      expect(typeof body.accessToken).toBe("string");
    });

    it("should set refresh token in HttpOnly cookie", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("refreshToken=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Strict");
      expect(setCookie).toContain("Path=/");
      expect(setCookie).toContain("Max-Age=604800"); // 7 days
    });

    it("should set Secure flag in cookie", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("Secure");
    });

    it("should return valid JSON response format", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Request Validation", () => {
    it("should return 400 for missing username", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: "password",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for missing password", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for empty username", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "",
          password: "password",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for empty password", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 400 for invalid JSON", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  describe("Authentication Errors", () => {
    it("should return 401 for invalid username", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "wronguser",
          password: "password",
        }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for invalid password", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "wrongpassword",
        }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  describe("Error Response Format", () => {
    it("should return ErrorResponse format for validation errors", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
        }),
      });

      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    it("should return ErrorResponse format for authentication errors", async () => {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "wronguser",
          password: "password",
        }),
      });

      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });
  });
});

describe("POST /auth/refresh", () => {
  let app: Hono;
  const testSecret = "test-secret-key-minimum-32-characters-long-for-security";

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;

    app = new Hono();
    app.onError(errorHandler);
    app.route("/auth", authRoutes);
  });

  describe("Successful Refresh", () => {
    it("should return 200 with new access token for valid refresh token", async () => {
      // First login to get a refresh token
      const loginRes = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = loginRes.headers.get("set-cookie")!;
      const refreshToken = setCookie.split(";")[0].split("=")[1];

      // Use refresh token to get new access token
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("accessToken");
      expect(typeof body.accessToken).toBe("string");
    });

    it("should return new access token with 15-minute expiry", async () => {
      // Login to get refresh token
      const loginRes = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = loginRes.headers.get("set-cookie")!;
      const refreshToken = setCookie.split(";")[0].split("=")[1];

      // Refresh
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      const body = await res.json();
      const payload = decodeJwt(body.accessToken);

      const expiryDuration = payload.exp! - payload.iat!;
      expect(expiryDuration).toBe(15 * 60); // 15 minutes
    });

    it("should preserve user information in new access token", async () => {
      // Login to get refresh token
      const loginRes = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = loginRes.headers.get("set-cookie")!;
      const refreshToken = setCookie.split(";")[0].split("=")[1];

      // Refresh
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      const body = await res.json();
      const payload = decodeJwt(body.accessToken);

      expect(payload.username).toBe("demo");
      expect(payload.sub).toBeDefined();
    });

    it("should return valid JSON response format", async () => {
      // Login to get refresh token
      const loginRes = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "demo",
          password: "password",
        }),
      });

      const setCookie = loginRes.headers.get("set-cookie")!;
      const refreshToken = setCookie.split(";")[0].split("=")[1];

      // Refresh
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Missing or Invalid Refresh Token", () => {
    it("should return 401 for missing refresh token cookie", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for empty refresh token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refreshToken=",
        },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for malformed refresh token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refreshToken=invalid-token",
        },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for expired refresh token", async () => {
      const secret = new TextEncoder().encode(testSecret);
      const now = Math.floor(Date.now() / 1000);

      // Create an expired refresh token
      const expiredToken = await new SignJWT({
        sub: "user-demo-001",
        username: "demo",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now - 7 * 24 * 60 * 60 - 3600) // 7 days + 1 hour ago
        .setExpirationTime(now - 1) // expired
        .sign(secret);

      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${expiredToken}`,
        },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return 401 for refresh token signed with wrong secret", async () => {
      const wrongSecret = new TextEncoder().encode(
        "wrong-secret-key-different-from-test",
      );
      const now = Math.floor(Date.now() / 1000);

      const tokenWithWrongSecret = await new SignJWT({
        sub: "user-demo-001",
        username: "demo",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now)
        .setExpirationTime(now + 7 * 24 * 60 * 60)
        .sign(wrongSecret);

      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${tokenWithWrongSecret}`,
        },
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });
  });

  describe("Error Response Format", () => {
    it("should return ErrorResponse format for missing token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
      });

      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    it("should return ErrorResponse format for invalid token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refreshToken=invalid",
        },
      });

      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });
  });
});
