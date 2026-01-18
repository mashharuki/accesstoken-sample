import { decodeJwt } from "jose";
import { useAuth } from "../contexts/use-auth.ts";

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
      <div>
        <h2>トークンデバッグ情報</h2>
        <p>トークンのデコードに失敗しました</p>
      </div>
    );
  }

  const exp = decodedPayload?.exp as number | undefined;

  return (
    <div>
      <h2>トークンデバッグ情報</h2>
      <div>
        <h3>有効期限</h3>
        {exp ? <p>有効期限: {exp}</p> : <p>有効期限情報がありません</p>}
      </div>
      <div>
        <h3>ペイロード</h3>
        <pre>{JSON.stringify(decodedPayload, null, 2)}</pre>
      </div>
    </div>
  );
};
