import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./routes/auth.routes.js";

const app = new Hono();

// Global error handler
app.onError(errorHandler);

// CORS middleware
app.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Routes
app.route("/auth", authRoutes);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
