import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "../contexts/auth-context.tsx";

const TestConsumer = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthContext is not available");
  }

  return (
    <div>
      <div data-testid="auth">{ctx.isAuthenticated ? "yes" : "no"}</div>
      <div data-testid="user">{ctx.user?.username ?? ""}</div>
      <div data-testid="token">{ctx.accessToken ?? ""}</div>
      <button type="button" onClick={() => ctx.login("demo", "password")}>
        login
      </button>
      <button type="button" onClick={() => ctx.logout()}>
        logout
      </button>
      <button type="button" onClick={() => ctx.refresh()}>
        refresh
      </button>
    </div>
  );
};

const mockJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should login and update authentication state", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith("/auth/refresh")) {
          return mockJsonResponse({ accessToken: "refreshed-token" });
        }
        if (url.endsWith("/auth/login")) {
          return mockJsonResponse({
            accessToken: "access-token",
            user: { id: "user-demo-001", username: "demo" },
          });
        }
        return mockJsonResponse({}, 404);
      });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("user")).toHaveTextContent("demo");
      expect(screen.getByTestId("token")).toHaveTextContent("access-token");
    });
  });

  it("should logout and clear authentication state", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/auth/refresh")) {
        return mockJsonResponse({ accessToken: "refreshed-token" });
      }
      if (url.endsWith("/auth/login")) {
        return mockJsonResponse({
          accessToken: "access-token",
          user: { id: "user-demo-001", username: "demo" },
        });
      }
      return mockJsonResponse({}, 404);
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });

    fireEvent.click(screen.getByText("logout"));

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("user")).toHaveTextContent("");
      expect(screen.getByTestId("token")).toHaveTextContent("");
    });
  });

  it("should refresh token on mount", async () => {
    // Create a valid JWT-like token with user info
    const payload = {
      sub: "user-demo-001",
      username: "demo",
      exp: Math.floor(Date.now() / 1000) + 900,
      iat: Math.floor(Date.now() / 1000),
    };
    const base64url = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    const header = { alg: "HS256", typ: "JWT" };
    const refreshedToken = `${base64url(header)}.${base64url(payload)}.signature`;

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockJsonResponse({ accessToken: refreshedToken }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/auth/refresh",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent(refreshedToken);
      expect(screen.getByTestId("user")).toHaveTextContent("demo");
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    });
  });

  it("should avoid concurrent refresh calls", async () => {
    let resolveResponse: (value: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => pendingResponse);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText("refresh"));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse!(mockJsonResponse({ accessToken: "refreshed-token" }));
  });
});
