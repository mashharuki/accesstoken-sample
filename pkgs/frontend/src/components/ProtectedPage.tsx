import { useEffect, useState } from "react";
import { useAuth } from "../contexts/use-auth.ts";
import { createApiClient } from "../lib/api-client.ts";
import { TokenDebugPanel } from "./TokenDebugPanel.tsx";

interface ProtectedData {
  message: string;
  user: {
    id: string;
    username: string;
  };
  timestamp: number;
}

interface ProtectedPageProps {
  debugMode?: boolean;
}

export const ProtectedPage = ({ debugMode = false }: ProtectedPageProps) => {
  const { accessToken, refresh } = useAuth();
  const [data, setData] = useState<ProtectedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiClient = createApiClient({
          baseURL: "http://localhost:3001",
          debugMode: false,
          getAccessToken: () => accessToken,
          refresh,
        });

        const result = await apiClient.get<ProtectedData>("/api/protected");
        setData(result);
      } catch (err) {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, refresh]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (!data) {
    return <div>データがありません</div>;
  }

  return (
    <div>
      <h1>保護されたページ</h1>
      <div>
        <p>{data.message}</p>
        <p>ユーザー: {data.user.username}</p>
        <p>タイムスタンプ: {data.timestamp}</p>
      </div>
      <TokenDebugPanel debugMode={debugMode} />
    </div>
  );
};
