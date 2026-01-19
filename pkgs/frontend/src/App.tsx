import { Navigate, Route, Routes } from "react-router-dom";
import { LoginForm } from "./components/LoginForm.tsx";
import { ProtectedPage } from "./components/ProtectedPage.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { useAuth } from "./hooks/use-auth.ts";

/**
 * App コンポーネント
 * @returns
 */
function App() {
  // 認証情報を取得
  const { isAuthenticated } = useAuth();
  const debugMode = import.meta.env.DEV;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/protected" replace /> : <LoginForm />
        }
      />
      <Route
        path="/protected"
        element={
          <ProtectedRoute>
            <ProtectedPage debugMode={debugMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/protected" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
