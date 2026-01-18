import { useEffect, useState } from "react";
import { useAuth } from "../contexts/use-auth.ts";
import { createApiClient } from "../lib/api-client.ts";
import { TokenDebugPanel } from "./TokenDebugPanel.tsx";
import styles from "./ProtectedPage.module.css";
import "../styles/design-system.module.css";

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
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
            <p className={styles.errorDetails}>
              ネットワーク接続を確認してください
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyMessage}>データがありません</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>保護されたページ</h1>
          <p className={styles.subtitle}>
            認証済みユーザーのみがアクセスできるコンテンツ
          </p>
        </header>

        <div className={styles.card}>
          <div className={styles.dataSection}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>メッセージ</span>
              <span className={styles.dataValue}>{data.message}</span>
            </div>

            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>ユーザー</span>
              <span className={styles.dataValue}>{data.user.username}</span>
            </div>

            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>タイムスタンプ</span>
              <span className={styles.dataValue}>{data.timestamp}</span>
            </div>
          </div>
        </div>

        <TokenDebugPanel debugMode={debugMode} />
      </div>
    </div>
  );
};
