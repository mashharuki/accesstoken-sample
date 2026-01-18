import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute.tsx";
import { useAuth } from "../contexts/use-auth.ts";

vi.mock("../contexts/use-auth.ts", () => ({
  useAuth: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement, initialPath = "/protected") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  it("should render children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-demo-001", username: "demo" },
      accessToken: "token",
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>protected content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("should redirect to login when unauthenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>protected content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("login page")).toBeInTheDocument();
  });
});
