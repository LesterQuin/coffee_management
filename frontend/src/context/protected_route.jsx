import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth_context";

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  // 1️⃣ Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2️⃣ Restrict Cashier from accessing admin-only routes
  const restrictedPaths = ["/dashboard", "/staff", "/chapel", "/fnb", "/report"];
  const isRestricted = restrictedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (user?.role?.toLowerCase() === "cashier" && isRestricted) {
    return <Navigate to="/cashier_dashboard" replace />;
  }

  // 3️⃣ Restrict Admin from accessing cashier routes (optional safety)
  if (user?.role?.toLowerCase() !== "cashier" && location.pathname.startsWith("/cashier_dashboard")) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allow access
  return children;
}
