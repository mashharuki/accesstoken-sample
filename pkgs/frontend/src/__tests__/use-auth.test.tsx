import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../contexts/auth-context.tsx";
import { useAuth } from "../hooks/use-auth.ts";

const AuthConsumer = () => {
  const auth = useAuth();
  return <div data-testid="auth">{auth.isAuthenticated ? "yes" : "no"}</div>;
};

describe("useAuth", () => {
  it("should expose auth context when wrapped with provider", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth")).toHaveTextContent("no");
  });

  it("should throw when used outside AuthProvider", () => {
    expect(() => render(<AuthConsumer />)).toThrow(
      "AuthContext is not available",
    );
  });
});
