import { decodeJwt } from "jose";
import { useAuth } from "../hooks/use-auth.ts";
import "../styles/design-system.module.css";
import styles from "../styles/TokenDebugPanel.module.css";

interface TokenDebugPanelProps {
  debugMode: boolean;
}

export const TokenDebugPanel = ({ debugMode }: TokenDebugPanelProps) => {
  const { accessToken } = useAuth();

  if (!debugMode || !accessToken) {
    return null;
  }

  let decodedPayload: Record<string, unknown> | null = null;
  let decodeError = false;

  try {
    decodedPayload = decodeJwt(accessToken);
  } catch (error) {
    decodeError = true;
  }

  if (decodeError) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            🛠️ トークンデバッグ情報
            <span className={styles.badge}>DEV</span>
          </h2>
        </div>
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>トークンのデコードに失敗しました</span>
        </div>
      </div>
    );
  }

  const exp = decodedPayload?.exp as number | undefined;
  const expDate = exp ? new Date(exp * 1000) : null;
  const now = new Date();
  const isExpired = expDate ? expDate < now : false;
  const timeRemaining = expDate
    ? Math.max(0, Math.floor((expDate.getTime() - now.getTime()) / 1000))
    : 0;

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds === 0) return "期限切れ";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          🛠️ トークンデバッグ情報
          <span className={styles.badge}>DEV</span>
        </h2>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⏰</span>
          有効期限
        </h3>
        <div className={styles.infoBox}>
          {exp ? (
            <>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>有効期限</span>
                <span className={styles.infoValue}>{exp}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>日時</span>
                <span className={styles.infoValue}>
                  {expDate?.toLocaleString("ja-JP")}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>残り時間</span>
                <span
                  className={styles.infoValue}
                  style={{
                    color: isExpired ? "var(--color-error)" : "inherit",
                  }}
                >
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            </>
          ) : (
            <p>有効期限情報がありません</p>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📦</span>
          ペイロード
        </h3>
        <div className={styles.codeBlock}>
          <pre className={styles.code}>
            {JSON.stringify(decodedPayload, null, 2)}
          </pre>
        </div>
      </div>

      <div className={styles.warningBox}>
        <span className={styles.warningIcon}>⚠️</span>
        <div className={styles.warningContent}>
          <h4 className={styles.warningTitle}>開発モードのみ</h4>
          <p className={styles.warningText}>
            このパネルは開発環境でのみ表示されます。本番環境では必ず
            debugMode=false に設定してください。
          </p>
        </div>
      </div>
    </div>
  );
};
