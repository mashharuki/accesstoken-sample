import type { MiddlewareHandler } from "hono";
import { AuthService } from "../services/auth.service.js";
import type { ErrorResponse } from "../types/api.types.js";
import type { Variables } from "../types/hono.types.js";

let authService: AuthService | null = null;

const getAuthService = () => {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
};

export const authMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader) {
    const response: ErrorResponse = {
      error: "Authorization header is required",
    };
    return c.json(response, 401);
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    const response: ErrorResponse = {
      error: "Invalid authorization header",
    };
    return c.json(response, 401);
  }

  try {
    const payload = await getAuthService().verifyAccessToken(token);
    c.set("user", payload);
    await next();
  } catch (error) {
    const response: ErrorResponse = {
      error: error instanceof Error ? error.message : "Invalid access token",
    };
    return c.json(response, 401);
  }
};
