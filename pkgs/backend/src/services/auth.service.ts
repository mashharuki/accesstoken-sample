import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  type LoginResult,
  type RefreshResult,
  type JWTPayload,
} from "../types/auth.types.js";

// Hardcoded user for learning purposes
const DEMO_USER = {
  id: "user-demo-001",
  username: "demo",
  password: "password", // Plain text for learning (NEVER do this in production)
};

export class AuthService {
  private readonly secret: Uint8Array;
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }

    if (jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async login(username: string, password: string): Promise<LoginResult> {
    // Validate input
    if (!username || !password) {
      throw new AuthenticationError("Username and password are required");
    }

    // Authenticate user (hardcoded for learning)
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
      throw new AuthenticationError("Invalid username or password");
    }

    // Generate tokens
    const now = Math.floor(Date.now() / 1000);

    const accessToken = await new SignJWT({
      sub: DEMO_USER.id,
      username: DEMO_USER.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + this.ACCESS_TOKEN_EXPIRY)
      .sign(this.secret);

    const refreshToken = await new SignJWT({
      sub: DEMO_USER.id,
      username: DEMO_USER.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + this.REFRESH_TOKEN_EXPIRY)
      .sign(this.secret);

    return {
      accessToken,
      refreshToken,
      user: {
        id: DEMO_USER.id,
        username: DEMO_USER.username,
      },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    // Validate input
    if (!refreshToken) {
      throw new InvalidTokenError("Refresh token is required");
    }

    try {
      // Verify refresh token
      const { payload } = await jwtVerify(refreshToken, this.secret, {
        algorithms: ["HS256"],
      });

      // Generate new access token
      const now = Math.floor(Date.now() / 1000);

      const accessToken = await new SignJWT({
        sub: payload.sub as string,
        username: payload.username as string,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now)
        .setExpirationTime(now + this.ACCESS_TOKEN_EXPIRY)
        .sign(this.secret);

      return {
        accessToken,
      };
    } catch (error) {
      if (error instanceof joseErrors.JWTExpired) {
        throw new TokenExpiredError("Refresh token has expired");
      }
      throw new InvalidTokenError("Invalid refresh token");
    }
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    // Validate input
    if (!token) {
      throw new InvalidTokenError("Access token is required");
    }

    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ["HS256"],
      });

      return {
        sub: payload.sub as string,
        username: payload.username as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      };
    } catch (error) {
      if (error instanceof joseErrors.JWTExpired) {
        throw new TokenExpiredError("Access token has expired");
      }
      throw new InvalidTokenError("Invalid access token");
    }
  }
}
