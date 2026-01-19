import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "../components/LoginForm.tsx";
import { useAuth } from "../hooks/use-auth.ts";

vi.mock("../contexts/use-auth.ts", () => ({
  useAuth: vi.fn(),
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

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render username/password inputs and submit button", () => {
    setupUseAuth();

    render(<LoginForm />);

    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" }),
    ).toBeInTheDocument();
  });

  it("should show validation error when fields are empty", async () => {
    setupUseAuth();

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText("ユーザー名とパスワードを入力してください"),
    ).toBeInTheDocument();
  });

  it("should call login with input values and call onSuccess", async () => {
    const auth = setupUseAuth();
    const onSuccess = vi.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "demo" },
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith("demo", "password");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should show error message when login fails", async () => {
    setupUseAuth({
      login: vi.fn(async () => {
        throw new Error("Login failed");
      }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "demo" },
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText("ログインに失敗しました"),
    ).toBeInTheDocument();
  });

  it("should disable submit button while logging in", async () => {
    setupUseAuth({
      login: vi.fn(() => new Promise<void>(() => {})),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "demo" },
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      screen.getByRole("button", { name: "ログイン中..." }),
    ).toBeDisabled();
  });
});
