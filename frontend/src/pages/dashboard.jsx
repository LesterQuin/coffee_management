// src/pages/dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Dashboard() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/staff");
        console.log("Staff API response:", res.data);
        setStaffList(res.data.data); // ✅ use .data from your API response
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError("Failed to load staff data");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading staff data...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">LQ Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome, <span className="font-semibold">{user?.email || "Admin"}</span>! Here’s an overview of the system.
      </p>

      {/* Staff Table */}
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
    </div>
  );
}
