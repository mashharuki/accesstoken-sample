import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.tsx";
import { AuthContext } from "../contexts/auth-context.tsx";
import type { ReactNode } from "react";
import * as apiClientModule from "../lib/api-client.ts";

vi.mock("../lib/api-client.ts", () => ({
  createApiClient: vi.fn(),
}));

interface AuthContextValue {
  isAuthenticated: boolean;
  user: { id: string; username: string } | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const createMockAuthValue = (
  overrides?: Partial<AuthContextValue>,
): AuthContextValue => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  login: vi.fn(async () => {}),
  logout: vi.fn(),
  refresh: vi.fn(async () => {}),
  ...overrides,
});

const renderWithAuth = (
  ui: ReactNode,
  authValue: AuthContextValue,
  initialRoute = "/",
) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  );
};

describe("Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login page at /login route", () => {
    const authValue = createMockAuthValue();
    renderWithAuth(<App />, authValue, "/login");

    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
  });

  it("should redirect to /login when accessing root path unauthenticated", () => {
    const authValue = createMockAuthValue();
    renderWithAuth(<App />, authValue, "/");

    // Should redirect to login page
    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
  });

  it("should render protected page at /protected when authenticated", async () => {
    const mockData = {
      message: "Protected data",
      user: { id: "1", username: "demo" },
      timestamp: 1234567890,
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    const authValue = createMockAuthValue({
      isAuthenticated: true,
      user: { id: "1", username: "demo" },
      accessToken: "valid-token",
    });

    renderWithAuth(<App />, authValue, "/protected");

    await waitFor(() => {
      expect(screen.getByText("保護されたページ")).toBeInTheDocument();
    });
  });

  it("should redirect to /login when accessing /protected unauthenticated", () => {
    const authValue = createMockAuthValue();
    renderWithAuth(<App />, authValue, "/protected");

    // Should redirect to login page
    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
  });

  it("should redirect authenticated user to /protected from root", async () => {
    const mockData = {
      message: "Protected data",
      user: { id: "1", username: "demo" },
      timestamp: 1234567890,
    };
    const mockGet = vi.fn(async () => mockData);
    vi.mocked(apiClientModule.createApiClient).mockReturnValue({
      get: mockGet as never,
      post: vi.fn(),
    });

    const authValue = createMockAuthValue({
      isAuthenticated: true,
      user: { id: "1", username: "demo" },
      accessToken: "valid-token",
    });

    renderWithAuth(<App />, authValue, "/");

    // Should redirect to protected page
    await waitFor(() => {
      expect(screen.getByText("保護されたページ")).toBeInTheDocument();
    });
  });
});
