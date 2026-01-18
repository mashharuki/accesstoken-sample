import { Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { ProtectedPage } from "./components/ProtectedPage.tsx";
import { useAuth } from "./contexts/use-auth.ts";

function App() {
  const { isAuthenticated } = useAuth();

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
            <ProtectedPage />
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
