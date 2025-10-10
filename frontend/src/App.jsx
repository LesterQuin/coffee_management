import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";
import Dashboard from "./pages/dashboard";
import Staff from "./pages/staff";
import Chapel from "./pages/chapel";
import Fnb from "./pages/fnb";
import Reports from "./pages/reports";
import Login from "./pages/login";
import CashierDashboard from "./pages/cashier_dashboard";
import Unauthorized from "./pages/unauthorized";
import ProtectedRoute from "./context/protected_route";
import { AuthProvider, useAuth } from "./context/auth_context";

function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex-col h-screen overflow-y-auto">
        <Navbar onLogout={logout} />
        <div className="flex-1 bg-gray-100 p-4">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/chapel" element={<Chapel />} />
            <Route path="/fnb" element={<Fnb />} />
            <Route path="/report" element={<Reports />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function CashierLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-green-700">LQ Cashier Panel</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <Routes>
        <Route path="/cashier_dashboard" element={<CashierDashboard />} />
        <Route path="*" element={<Navigate to="/cashier_dashboard" replace />} />
      </Routes>
    </div>
  );
}

function LayoutSelector() {
  const { user } = useAuth();

  if (user?.role?.toLowerCase() === "cashier") {
    return <CashierLayout />;
  }

  return <AdminLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <LayoutSelector />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
