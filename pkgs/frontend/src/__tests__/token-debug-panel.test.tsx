import { render, screen } from "@testing-library/react";
import * as jose from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenDebugPanel } from "../components/TokenDebugPanel.tsx";
import { useAuth } from "../hooks/use-auth.ts";

vi.mock("../contexts/use-auth.ts", () => ({
  useAuth: vi.fn(),
}));

vi.mock("jose", () => ({
  decodeJwt: vi.fn(),
}));

const setupUseAuth = (overrides?: Partial<ReturnType<typeof useAuth>>) => {
  const login = vi.fn(async () => {});
  const logout = vi.fn();
  const refresh = vi.fn(async () => {});
  const value = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    login,
    logout,
    refresh,
    ...overrides,
  };
  vi.mocked(useAuth).mockReturnValue(value);
  return value;
};

describe("TokenDebugPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when debugMode is false", () => {
    setupUseAuth();

    const { container } = render(<TokenDebugPanel debugMode={false} />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when debugMode is true but no accessToken", () => {
    setupUseAuth({ accessToken: null });

    const { container } = render(<TokenDebugPanel debugMode={true} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render token info when debugMode is true and accessToken exists", () => {
    const mockPayload = {
      sub: "user-123",
      username: "demo",
      exp: 1609459200, // Unix timestamp
      iat: 1609455600,
    };

    setupUseAuth({ accessToken: "valid.jwt.token" });
    vi.mocked(jose.decodeJwt).mockReturnValue(mockPayload);

    render(<TokenDebugPanel debugMode={true} />);

    expect(screen.getByText(/トークンデバッグ情報/)).toBeInTheDocument();
    expect(screen.getAllByText(/有効期限/).length).toBeGreaterThan(0);
    expect(screen.getByText(/ペイロード/)).toBeInTheDocument();
  });

  it("should display expiration time from JWT payload", () => {
    const mockPayload = {
      sub: "user-123",
      username: "demo",
      exp: 1609459200,
      iat: 1609455600,
    };

    setupUseAuth({ accessToken: "valid.jwt.token" });
    vi.mocked(jose.decodeJwt).mockReturnValue(mockPayload);

    render(<TokenDebugPanel debugMode={true} />);

    // Should display the expiration timestamp (now shown as a value in infoRow)
    expect(screen.getByText("1609459200")).toBeInTheDocument();
  });

  it("should display decoded JWT payload", () => {
    const mockPayload = {
      sub: "user-123",
      username: "demo",
      exp: 1609459200,
      iat: 1609455600,
    };

    setupUseAuth({ accessToken: "valid.jwt.token" });
    vi.mocked(jose.decodeJwt).mockReturnValue(mockPayload);

    render(<TokenDebugPanel debugMode={true} />);

    // Should display payload fields
    expect(screen.getByText(/user-123/)).toBeInTheDocument();
    expect(screen.getByText(/demo/)).toBeInTheDocument();
  });

  it("should handle JWT decode errors gracefully", () => {
    setupUseAuth({ accessToken: "invalid.token" });
    vi.mocked(jose.decodeJwt).mockImplementation(() => {
      throw new Error("Invalid JWT");
    });

    render(<TokenDebugPanel debugMode={true} />);

    expect(
      screen.getByText(/トークンのデコードに失敗しました/),
    ).toBeInTheDocument();
  });
});
