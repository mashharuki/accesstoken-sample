import { describe, expect, it, vi, beforeEach } from "vitest";
import { createApiClient } from "../lib/api-client.ts";

const mockJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should attach Authorization header and include credentials", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));
    const refresh = vi.fn(async () => {});

    const client = createApiClient({
      baseURL: "http://localhost:3001",
      debugMode: false,
      getAccessToken: () => "access-token",
      refresh,
    });

    await client.get("/api/protected");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/protected",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("should refresh on 401 and retry once with updated token", async () => {
    let token = "expired-token";
    const refresh = vi.fn(async () => {
      token = "fresh-token";
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));

    const client = createApiClient({
      baseURL: "http://localhost:3001",
      debugMode: false,
      getAccessToken: () => token,
      refresh,
    });

    await client.get("/api/protected");

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/api/protected",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fresh-token",
        }),
      }),
    );
  });

  it("should not retry endlessly on repeated 401 responses", async () => {
    const refresh = vi.fn(async () => {});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 401 }));

    const client = createApiClient({
      baseURL: "http://localhost:3001",
      debugMode: false,
      getAccessToken: () => "expired-token",
      refresh,
    });

    await expect(client.get("/api/protected")).rejects.toThrow(
      "Request failed with status 401",
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should log requests when debug mode is enabled", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const client = createApiClient({
      baseURL: "http://localhost:3001",
      debugMode: true,
      getAccessToken: () => null,
      refresh: async () => {},
    });

    await client.get("/api/protected");

    expect(fetchMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });
});
