import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth_context";

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  // 1️⃣ Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2️⃣ Restrict Cashier from accessing Admin-only pages
  const adminPaths = ["/staff", "/chapel", "/fnb", "/report", "/admin"];
  const isAdminPage = adminPaths.some((path) => location.pathname.startsWith(path));

  if (user?.role?.toLowerCase() === "cashier" && isAdminPage) {
    // redirect Cashier to /dashboard where Cashier layout is rendered
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allow access
  return children;
}
