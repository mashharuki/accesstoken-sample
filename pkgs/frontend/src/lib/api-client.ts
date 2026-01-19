export interface ApiClientConfig {
  baseURL: string;
  debugMode: boolean;
  getAccessToken: () => string | null;
  refresh: () => Promise<void>;
}

export interface ApiClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body: unknown) => Promise<T>;
}

const buildUrl = (baseURL: string, path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseURL}${normalizedPath}`;
};

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  const request = async <T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    hasRetried = false,
  ): Promise<T> => {
    const url = buildUrl(config.baseURL, path);
    const headers: Record<string, string> = {};
    const token = config.getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (config.debugMode) {
      console.log("[apiClient]", method, url);
    }

    // HTTP リクエストを作成する。
    // `credentials: "include"` を指定して、クッキーを送信する(リフレッシュトークンなど)。
    const response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && !hasRetried) {
      await config.refresh();
      return request<T>(method, path, body, true);
    }

    if (config.debugMode) {
      console.log("[apiClient]", response.status, url);
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  };

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  };
};
