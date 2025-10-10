// src/pages/staff.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Staff() {
  const { token } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "Staff",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load staff list
  const fetchStaff = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setStaffList(res.data.data);
    } catch {
      setError("Failed to load staff");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Create staff
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/staff/register", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ fullName: "", email: "", phone: "", role: "Staff", password: "" });
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating staff");
    } finally {
      setLoading(false);
    }
  };

  // Delete staff
  const handleDelete = async (staffID) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/staff/${staffID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local state
      setStaffList((prev) => prev.filter((s) => s.staffID !== staffID));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete staff");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold mb-2">👤 Staff Management</h2>

      {/* Add staff form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow flex flex-wrap gap-3"
      >
        <input
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[200px]"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[200px]"
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[150px]"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 rounded min-w-[120px]"
        >
          <option>Admin</option>
          <option>Casier</option>
          <option>Staff</option>
        </select>
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[150px]"
          required
        />
        <button
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Staff"}
        </button>
      </form>

      {/* Errors */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Staff table */}
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Email</th>
            <th className="py-2 px-4 text-left">Phone</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((s) => (
            <tr key={s.staffID} className="border-t hover:bg-gray-50">
              <td className="py-2 px-4">{s.fullName}</td>
              <td className="py-2 px-4">{s.email}</td>
              <td className="py-2 px-4">{s.phone}</td>
              <td className="py-2 px-4">{s.role}</td>
              <td className="py-2 px-4 text-center">
                <button
                  onClick={() => handleDelete(s.staffID)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
