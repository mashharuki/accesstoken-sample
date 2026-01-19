import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context.tsx";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthContext is not available");
  }
  return context;
};
