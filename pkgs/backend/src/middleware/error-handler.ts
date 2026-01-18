import type { ErrorHandler } from "hono";
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
} from "../types/auth.types.js";
import type { ErrorResponse } from "../types/api.types.js";

export const errorHandler: ErrorHandler = (err, c) => {
  // Log all errors
  console.error("Unhandled error:", err);

  // Handle custom authentication errors
  if (
    err instanceof AuthenticationError ||
    err instanceof TokenExpiredError ||
    err instanceof InvalidTokenError
  ) {
    const response: ErrorResponse = {
      error: err.message,
    };
    return c.json(response, 401);
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error: "Internal Server Error",
  };
  return c.json(response, 500);
};
