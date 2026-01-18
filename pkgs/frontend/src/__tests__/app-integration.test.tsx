import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/auth-context.tsx";
import { useAuth } from "../contexts/use-auth.ts";
import App from "../App.tsx";

// Mock fetch for AuthProvider's automatic refresh on mount
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Debug component to check auth state
const AuthDebug = () => {
  const { isAuthenticated, user, accessToken } = useAuth();
  return (
    <div data-testid="auth-debug">
      <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-id">{user?.id || "null"}</span>
      <span data-testid="has-token">{accessToken ? "yes" : "no"}</span>
    </div>
  );
};

describe("App Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the app with AuthProvider and BrowserRouter", async () => {
    // Mock the refresh endpoint to fail (no refresh token)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    // Render the app with the full provider hierarchy
    render(
      <AuthProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    // Wait for the app to render
    await waitFor(
      () => {
        expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify the refresh endpoint was called on mount
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );

    // Check that we have a form (LoginForm component)
    const form = screen.getByLabelText("ユーザー名").closest("form");
    expect(form).toBeInTheDocument();
  });

  it("should restore authentication state on page refresh when refresh token is valid", async () => {
    // Create a simple JWT-like token that can be decoded by jose.decodeJwt
    // JWT format: header.payload.signature (all base64url encoded)
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      sub: "1",
      username: "demo",
      exp: Math.floor(Date.now() / 1000) + 900,
      iat: Math.floor(Date.now() / 1000),
    };

    // Base64url encode (simplified - just using Buffer for Node.js compatibility)
    const base64url = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const accessToken = `${base64url(header)}.${base64url(payload)}.fake-signature`;

    // Mock successful refresh with valid token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: accessToken,
      }),
    });

    // Mock the protected endpoint call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Protected data",
        user: { id: "1", username: "demo" },
        timestamp: Date.now(),
      }),
    });

    // Render the app with the full provider hierarchy to simulate page refresh
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AuthDebug />
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    // Verify the refresh endpoint was called on mount
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/auth/refresh",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    // Wait for auth state to be updated after successful refresh
    await waitFor(
      () => {
        const isAuth = screen.getByTestId("is-authenticated").textContent;
        const hasToken = screen.getByTestId("has-token").textContent;
        const userId = screen.getByTestId("user-id").textContent;
        if (isAuth !== "true" || hasToken !== "yes" || userId === "null") {
          throw new Error(
            `Auth state not updated: isAuth=${isAuth}, hasToken=${hasToken}, userId=${userId}`,
          );
        }
        expect(isAuth).toBe("true");
      },
      { timeout: 3000 },
    );

    // Wait for the app to render the protected page after successful refresh
    await waitFor(
      () => {
        expect(screen.getByText("保護されたページ")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify user is authenticated and sees protected content
    await waitFor(() => {
      expect(screen.getByText(/Protected data/)).toBeInTheDocument();
    });
  });

  it("should redirect to login page when refresh token is expired", async () => {
    // Mock expired refresh token (401 response)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Refresh token expired" }),
    });

    // Render the app with the full provider hierarchy to simulate page refresh
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    // Wait for the app to redirect to login page
    await waitFor(
      () => {
        expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify the refresh endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );

    // Verify user sees login form
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
  });
});
