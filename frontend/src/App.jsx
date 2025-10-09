import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";
import Dashboard from "./pages/dashboard";
import Staff from "./pages/staff";
import Chapel from "./pages/chapel";
import Fnb from "./pages/fnb";
import Reports from "./pages/reports";
import Login from "./pages/login";
import ProtectedRoute from "./context/protected_route";
import { AuthProvider, useAuth} from "./context/auth_context";

function Layout() {
  const { logout } = useAuth();
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Navbar onLogout={logout} />
        <div className="flex-1 bg-gray-100">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/chapel" element={<Chapel />} />
              <Route path="/fnb" element={<Fnb />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </div>
  );
}

function App() {
  return(
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element = {
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
