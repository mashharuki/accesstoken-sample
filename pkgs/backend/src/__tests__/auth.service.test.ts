import { describe, it, expect, beforeAll } from "vitest";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { AuthService } from "../services/auth.service.js";
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
} from "../types/auth.types.js";

describe("AuthService", () => {
  let authService: AuthService;
  const testSecret = "test-secret-key-minimum-32-characters-long-for-security";

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
    authService = new AuthService();
  });

  describe("login", () => {
    it("should successfully authenticate with correct credentials (demo/password)", async () => {
      const result = await authService.login("demo", "password");

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe("demo");
      expect(result.user.id).toBeDefined();
    });

    it("should throw AuthenticationError with incorrect username", async () => {
      await expect(authService.login("wronguser", "password")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw AuthenticationError with incorrect password", async () => {
      await expect(authService.login("demo", "wrongpassword")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw AuthenticationError with empty username", async () => {
      await expect(authService.login("", "password")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw AuthenticationError with empty password", async () => {
      await expect(authService.login("demo", "")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should generate Access Token with 15-minute expiry", async () => {
      const result = await authService.login("demo", "password");
      const payload = decodeJwt(result.accessToken);

      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();

      const expiryDuration = payload.exp! - payload.iat!;
      const expectedDuration = 15 * 60; // 15 minutes in seconds

      expect(expiryDuration).toBe(expectedDuration);
    });

    it("should generate Refresh Token with 7-day expiry", async () => {
      const result = await authService.login("demo", "password");
      const payload = decodeJwt(result.refreshToken);

      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();

      const expiryDuration = payload.exp! - payload.iat!;
      const expectedDuration = 7 * 24 * 60 * 60; // 7 days in seconds

      expect(expiryDuration).toBe(expectedDuration);
    });

    it("should include correct JWT payload structure in Access Token", async () => {
      const result = await authService.login("demo", "password");
      const payload = decodeJwt(result.accessToken);

      expect(payload.sub).toBeDefined();
      expect(payload.username).toBe("demo");
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it("should include correct JWT payload structure in Refresh Token", async () => {
      const result = await authService.login("demo", "password");
      const payload = decodeJwt(result.refreshToken);

      expect(payload.sub).toBeDefined();
      expect(payload.username).toBe("demo");
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it("should sign tokens with HS256 algorithm", async () => {
      const result = await authService.login("demo", "password");
      const secret = new TextEncoder().encode(testSecret);

      // Verify that tokens can be verified with HS256
      const accessTokenVerification = await jwtVerify(
        result.accessToken,
        secret,
        {
          algorithms: ["HS256"],
        },
      );
      expect(accessTokenVerification.payload).toBeDefined();

      const refreshTokenVerification = await jwtVerify(
        result.refreshToken,
        secret,
        {
          algorithms: ["HS256"],
        },
      );
      expect(refreshTokenVerification.payload).toBeDefined();
    });

    it("should use consistent user ID for the same username", async () => {
      const result1 = await authService.login("demo", "password");
      const result2 = await authService.login("demo", "password");

      expect(result1.user.id).toBe(result2.user.id);
    });

    it("should generate different tokens on each login", async () => {
      const result1 = await authService.login("demo", "password");

      // Wait 1 second to ensure different iat timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result2 = await authService.login("demo", "password");

      // Tokens should be different due to different iat timestamps
      expect(result1.accessToken).not.toBe(result2.accessToken);
      expect(result1.refreshToken).not.toBe(result2.refreshToken);
    });
  });

  describe("verifyAccessToken", () => {
    it("should successfully verify a valid access token", async () => {
      const loginResult = await authService.login("demo", "password");
      const payload = await authService.verifyAccessToken(
        loginResult.accessToken,
      );

      expect(payload).toBeDefined();
      expect(payload.sub).toBeDefined();
      expect(payload.username).toBe("demo");
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it("should throw InvalidTokenError for malformed token", async () => {
      await expect(
        authService.verifyAccessToken("invalid-token"),
      ).rejects.toThrow(InvalidTokenError);
    });

    it("should throw InvalidTokenError for empty token", async () => {
      await expect(authService.verifyAccessToken("")).rejects.toThrow(
        InvalidTokenError,
      );
    });

    it("should throw TokenExpiredError for expired token", async () => {
      const secret = new TextEncoder().encode(testSecret);
      const now = Math.floor(Date.now() / 1000);

      // Create an already-expired token (exp in the past)
      const expiredToken = await new SignJWT({
        sub: "user-demo-001",
        username: "demo",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now - 3600) // 1 hour ago
        .setExpirationTime(now - 1) // expired 1 second ago
        .sign(secret);

      await expect(authService.verifyAccessToken(expiredToken)).rejects.toThrow(
        TokenExpiredError,
      );
    });

    it("should throw InvalidTokenError for token signed with wrong secret", async () => {
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
        .setExpirationTime(now + 900)
        .sign(wrongSecret);

      await expect(
        authService.verifyAccessToken(tokenWithWrongSecret),
      ).rejects.toThrow(InvalidTokenError);
    });

    it("should return correct payload structure", async () => {
      const loginResult = await authService.login("demo", "password");
      const payload = await authService.verifyAccessToken(
        loginResult.accessToken,
      );

      expect(payload).toHaveProperty("sub");
      expect(payload).toHaveProperty("username");
      expect(payload).toHaveProperty("exp");
      expect(payload).toHaveProperty("iat");
      expect(typeof payload.exp).toBe("number");
      expect(typeof payload.iat).toBe("number");
    });
  });

  describe("refresh", () => {
    it("should successfully issue new access token from valid refresh token", async () => {
      const loginResult = await authService.login("demo", "password");
      const refreshResult = await authService.refresh(loginResult.refreshToken);

      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(typeof refreshResult.accessToken).toBe("string");
    });

    it("should issue new access token with 15-minute expiry", async () => {
      const loginResult = await authService.login("demo", "password");
      const refreshResult = await authService.refresh(loginResult.refreshToken);

      const payload = decodeJwt(refreshResult.accessToken);
      const expiryDuration = payload.exp! - payload.iat!;
      const expectedDuration = 15 * 60; // 15 minutes

      expect(expiryDuration).toBe(expectedDuration);
    });

    it("should preserve user information in new access token", async () => {
      const loginResult = await authService.login("demo", "password");
      const refreshResult = await authService.refresh(loginResult.refreshToken);

      const payload = decodeJwt(refreshResult.accessToken);
      expect(payload.username).toBe("demo");
      expect(payload.sub).toBeDefined();
    });

    it("should throw InvalidTokenError for malformed refresh token", async () => {
      await expect(authService.refresh("invalid-token")).rejects.toThrow(
        InvalidTokenError,
      );
    });

    it("should throw InvalidTokenError for empty refresh token", async () => {
      await expect(authService.refresh("")).rejects.toThrow(InvalidTokenError);
    });

    it("should throw TokenExpiredError for expired refresh token", async () => {
      const secret = new TextEncoder().encode(testSecret);
      const now = Math.floor(Date.now() / 1000);

      // Create an expired refresh token
      const expiredRefreshToken = await new SignJWT({
        sub: "user-demo-001",
        username: "demo",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now - 7 * 24 * 60 * 60 - 3600) // 7 days + 1 hour ago
        .setExpirationTime(now - 1) // expired
        .sign(secret);

      await expect(authService.refresh(expiredRefreshToken)).rejects.toThrow(
        TokenExpiredError,
      );
    });

    it("should throw InvalidTokenError for refresh token signed with wrong secret", async () => {
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

      await expect(authService.refresh(tokenWithWrongSecret)).rejects.toThrow(
        InvalidTokenError,
      );
    });

    it("should generate different access tokens on each refresh", async () => {
      const loginResult = await authService.login("demo", "password");

      const refreshResult1 = await authService.refresh(
        loginResult.refreshToken,
      );

      // Wait to ensure different iat
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshResult2 = await authService.refresh(
        loginResult.refreshToken,
      );

      expect(refreshResult1.accessToken).not.toBe(refreshResult2.accessToken);
    });
  });

  describe("constructor", () => {
    it("should throw error if JWT_SECRET is not set", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => new AuthService()).toThrow(
        "JWT_SECRET environment variable is required",
      );

      process.env.JWT_SECRET = originalSecret;
    });

    it("should throw error if JWT_SECRET is too short", () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "short";

      expect(() => new AuthService()).toThrow(
        "JWT_SECRET must be at least 32 characters long",
      );

      process.env.JWT_SECRET = originalSecret;
    });
  });
});
