import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { ProtectedResponse } from "../types/api.types.js";
import type { Variables } from "../types/hono.types.js";

export const protectedRoutes = new Hono<{ Variables: Variables }>();

protectedRoutes.get("/protected", authMiddleware, (c) => {
  const user = c.get("user");

  const response: ProtectedResponse = {
    message: "Protected resource access granted",
    user: {
      id: user.sub,
      username: user.username,
    },
    timestamp: Date.now(),
  };

  return c.json(response, 200);
});
