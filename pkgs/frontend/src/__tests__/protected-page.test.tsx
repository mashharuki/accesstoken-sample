import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProtectedPage } from "../components/ProtectedPage.tsx";
import { useAuth } from "../contexts/use-auth.ts";
import * as apiClientModule from "../lib/api-client.ts";

vi.mock("../contexts/use-auth.ts", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/api-client.ts", () => ({
  createApiClient: vi.fn(),
}));

const setupUseAuth = (overrides?: Partial<ReturnType<typeof useAuth>>) => {
  const login = vi.fn(async () => {});
  const logout = vi.fn();
  const refresh = vi.fn(async () => {});
  const value = {
    isAuthenticated: true,
    user: { id: "1", username: "demo" },
    accessToken: "valid-token",
    login,
    logout,
    refresh,
    ...overrides,
  };
  vi.mocked(useAuth).mockReturnValue(value);
  return value;
};

describe("ProtectedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state on mount", () => {
    setupUseAuth();
    const mockGet = vi.fn(() => new Promise(() => {}));
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("should fetch and display protected data", async () => {
    setupUseAuth();
    const mockData = {
      message: "This is protected content",
      user: { id: "1", username: "demo" },
      timestamp: 1234567890,
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/api/protected");
      expect(screen.getByText(/This is protected content/)).toBeInTheDocument();
      expect(screen.getByText(/demo/)).toBeInTheDocument();
    });
  });

  it("should show error message when fetch fails", async () => {
    setupUseAuth();
    const mockGet = vi.fn(async () => {
      throw new Error("Failed to fetch");
    });
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage />);

    expect(
      await screen.findByText("データの取得に失敗しました"),
    ).toBeInTheDocument();
  });

  it("should display timestamp in readable format", async () => {
    setupUseAuth();
    const mockData = {
      message: "Test message",
      user: { id: "1", username: "demo" },
      timestamp: 1609459200000, // 2021-01-01 00:00:00 UTC
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage />);

    await waitFor(() => {
      expect(screen.getByText(/1609459200000/)).toBeInTheDocument();
    });
  });

  it("should not show TokenDebugPanel when debugMode is false", async () => {
    setupUseAuth();
    const mockData = {
      message: "Test message",
      user: { id: "1", username: "demo" },
      timestamp: 1234567890,
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
    });

    // TokenDebugPanel should not be rendered
    expect(screen.queryByText("トークンデバッグ情報")).not.toBeInTheDocument();
  });

  it("should show TokenDebugPanel when debugMode is true", async () => {
    // Create a valid JWT-like token
    const payload = {
      sub: "1",
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
    const validToken = `${base64url(header)}.${base64url(payload)}.signature`;

    setupUseAuth({ accessToken: validToken });
    const mockData = {
      message: "Test message",
      user: { id: "1", username: "demo" },
      timestamp: 1234567890,
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    render(<ProtectedPage debugMode={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
    });

    // TokenDebugPanel should be rendered
    expect(screen.getByText("トークンデバッグ情報")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "有効期限" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ペイロード" }),
    ).toBeInTheDocument();
  });
});
