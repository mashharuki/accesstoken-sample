import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../middleware/error-handler.js";
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
} from "../types/auth.types.js";

describe("Error Handler Middleware", () => {
  let app: Hono;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    app = new Hono();
    app.onError(errorHandler);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Custom Error Handling", () => {
    it("should return 401 for AuthenticationError", async () => {
      app.get("/test", () => {
        throw new AuthenticationError("Invalid credentials");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({
        error: "Invalid credentials",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should return 401 for TokenExpiredError", async () => {
      app.get("/test", () => {
        throw new TokenExpiredError("Token has expired");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({
        error: "Token has expired",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should return 401 for InvalidTokenError", async () => {
      app.get("/test", () => {
        throw new InvalidTokenError("Invalid token");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({
        error: "Invalid token",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Generic Error Handling", () => {
    it("should return 500 for generic Error", async () => {
      app.get("/test", () => {
        throw new Error("Something went wrong");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({
        error: "Internal Server Error",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unhandled error:",
        expect.any(Error),
      );
    });

    it("should return 500 for custom error classes", async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }

      app.get("/test", () => {
        throw new CustomError("Custom error occurred");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({
        error: "Internal Server Error",
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Error Response Format", () => {
    it("should always return ErrorResponse format", async () => {
      app.get("/test", () => {
        throw new AuthenticationError("Test error");
      });

      const res = await app.request("/test");
      const body = await res.json();

      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    it("should set correct content-type header", async () => {
      app.get("/test", () => {
        throw new Error("Test");
      });

      const res = await app.request("/test");

      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("Error Logging", () => {
    it("should log all errors to console.error", async () => {
      app.get("/test1", () => {
        throw new AuthenticationError("Auth error");
      });
      app.get("/test2", () => {
        throw new Error("Generic error");
      });

      await app.request("/test1");
      await app.request("/test2");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });
  });
});
