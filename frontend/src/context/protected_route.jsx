import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth_context";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
