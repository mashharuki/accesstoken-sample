import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { AuthService } from "../services/auth.service.js";
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  ErrorResponse,
} from "../types/api.types.js";

export const authRoutes = new Hono();

// Lazy initialization of AuthService
let authService: AuthService | null = null;
const getAuthService = () => {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
};

// POST /auth/login
authRoutes.post("/login", async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json().catch(() => {
      throw new Error("Invalid JSON");
    });

    const { username, password } = body as LoginRequest;

    // Validate required fields
    if (!username || !password) {
      const response: ErrorResponse = {
        error: "Username and password are required",
      };
      return c.json(response, 400);
    }

    // Authenticate user
    const result = await getAuthService().login(username, password);

    // Set refresh token in HttpOnly cookie
    setCookie(c, "refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 604800, // 7 days in seconds
    });

    // Return access token and user info
    const response: LoginResponse = {
      accessToken: result.accessToken,
      user: result.user,
    };

    return c.json(response, 200);
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof Error && error.message === "Invalid JSON") {
      const response: ErrorResponse = {
        error: "Invalid request body",
      };
      return c.json(response, 400);
    }

    // Re-throw other errors to be handled by global error handler
    throw error;
  }
});

// POST /auth/refresh
authRoutes.post("/refresh", async (c) => {
  // Get refresh token from cookie
  const refreshToken = getCookie(c, "refreshToken");

  // Validate refresh token exists
  if (!refreshToken) {
    const response: ErrorResponse = {
      error: "Refresh token is required",
    };
    return c.json(response, 401);
  }

  // Call AuthService to refresh the access token
  const result = await getAuthService().refresh(refreshToken);

  // Return new access token
  const response: RefreshResponse = {
    accessToken: result.accessToken,
  };

  return c.json(response, 200);
});
