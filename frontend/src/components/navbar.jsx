// src/components/navbar.jsx
import { useAuth } from "../context/auth_context";

export default function Navbar({ onLogout }) {
  const { user } = useAuth();

  return (
    <nav className="flex justify-between items-center bg-blue-600 text-white p-4 shadow-md">
      <div className="text-xl font-bold">LQ System</div>
      <div className="flex items-center gap-4">
        <p>
          <span className="font-semibold">Welcome, </span>
          {user?.email || "Guest"} — <span className="italic">Role: {user?.role || "Unknown"}</span>
        </p>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
