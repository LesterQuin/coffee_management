// src/components/sidebar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth_context";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-60 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-lg font-semibold mb-6">LQ System</h2>
      <ul className="space-y-3">
        {/* Admin-only links */}
        {user?.role?.toLowerCase() === "admin" && (
          <>
            <li>
              <Link to="/dashboard" className="block hover:text-blue-400">Dashboard</Link>
            </li>
            <li>
              <Link to="/staff" className="block hover:text-blue-400">Staff</Link>
            </li>
            <li>
              <Link to="/chapel" className="block hover:text-blue-400">Chapel</Link>
            </li>
            <li>
              <Link to="/fnb" className="block hover:text-blue-400">F&B</Link>
            </li>
            <li>
              <Link to="/report" className="block hover:text-blue-400">Reports</Link>
            </li>
          </>
        )}

        {/* Cashier-only links */}
        {user?.role?.toLowerCase() === "casier" && (
          <li>
            <Link to="/cashier_dashboard" className="block hover:text-blue-400">
              Cashier Dashboard
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
