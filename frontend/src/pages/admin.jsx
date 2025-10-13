// src/pages/dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [chapelList, setChapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        if (user?.role?.toLowerCase() === "admin") {
          const staffRes = await axios.get("http://localhost:5000/api/staff", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStaffList(staffRes.data.data || []);
        }

        const chapelsRes = await axios.get("http://localhost:5000/api/chapel/available", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChapelList(chapelsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, user?.role]);

  if (loading) return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-600">
        {user?.role?.toLowerCase() === "admin" ? "LQ Admin Dashboard" : "Cashier Dashboard"}
      </h1>
      <p className="text-gray-600">
        Welcome, <span className="font-semibold">{user?.email}</span>!
      </p>

      {user?.role?.toLowerCase() === "admin" && (
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Staff Overview</h2>
          {staffList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No staff found</p>
          ) : (
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left">ID</th>
                  <th className="border px-4 py-2 text-left">Full Name</th>
                  <th className="border px-4 py-2 text-left">Email</th>
                  <th className="border px-4 py-2 text-left">Phone</th>
                  <th className="border px-4 py-2 text-left">Role</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.staffID}>
                    <td className="border px-4 py-2">{staff.staffID}</td>
                    <td className="border px-4 py-2">{staff.fullName}</td>
                    <td className="border px-4 py-2">{staff.email}</td>
                    <td className="border px-4 py-2">{staff.phone}</td>
                    <td className="border px-4 py-2">{staff.role}</td>
                    <td className="border px-4 py-2">{staff.status || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Chapels Overview: visible to both Admin and Cashier */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Chapels Overview</h2>
        {chapelList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No chapels found</p>
        ) : (
          <ul className="space-y-1">
            {chapelList.map((chapel) => (
              <li key={chapel.chapelID} className="border-b py-1">
                <span className="font-semibold">{chapel.chapelName}</span> — Status: {chapel.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
