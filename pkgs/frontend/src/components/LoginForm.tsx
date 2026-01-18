import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/use-auth.ts";
import styles from "./LoginForm.module.css";
import "../styles/design-system.module.css";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setError("ユーザー名とパスワードを入力してください");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      onSuccess?.();
    } catch (err) {
      setError("ログインに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>アカウント情報を入力してください</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-username">
              ユーザー名
            </label>
            <input
              id="login-username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              placeholder="demo"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              パスワード
            </label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${isSubmitting ? styles.buttonLoading : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};
