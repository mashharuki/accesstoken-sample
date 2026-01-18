import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { decodeJwt } from "jose";

interface UserInfo {
  id: string;
  username: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

interface RefreshResponse {
  accessToken: string;
}

const API_BASE_URL = "http://localhost:3001";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const refreshInProgress = useRef(false);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = (await res.json()) as LoginResponse;
    if (!data.accessToken || !data.user?.id || !data.user?.username) {
      throw new Error("Invalid login response");
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshInProgress.current) {
      return;
    }

    refreshInProgress.current = true;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data = (await res.json()) as RefreshResponse;
      if (!data.accessToken) {
        throw new Error("Invalid refresh response");
      }

      // Decode access token to extract user info
      const payload = decodeJwt(data.accessToken);
      const userId = payload.sub as string;
      const username = payload.username as string;

      if (!userId || !username) {
        throw new Error("Invalid token payload");
      }

      setAccessToken(data.accessToken);
      setUser({
        id: userId,
        username: username,
      });
    } catch (error) {
      setAccessToken(null);
      setUser(null);
      throw error;
    } finally {
      refreshInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      // Refresh failure should leave the app unauthenticated.
    });
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(accessToken),
      user,
      accessToken,
      login,
      logout,
      refresh,
    }),
    [accessToken, user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
