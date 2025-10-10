// src/context/login_redirect.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth_context";

export default function LoginRedirect({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
