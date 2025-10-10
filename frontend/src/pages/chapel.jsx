import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Chapel() {
  const { token } = useAuth();
  const [chapels, setChapels] = useState([]);
  const [form, setForm] = useState({
    chapelName: "",
    description: "",
    status: "Available",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Load chapel rooms
  const fetchChapels = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chapel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setChapels(res.data.data);
    } catch (err) {
      setError("Failed to load chapel rooms");
    }
  };

  useEffect(() => {
    fetchChapels();
  }, []);

  // ✅ Create new chapel room
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/chapel", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ chapelName: "", description: "", status: "Available" });
      fetchChapels();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating chapel room");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update chapel status
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/chapel/status/${id}`, 
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchChapels();
    } catch {
      setError("Failed to update chapel status");
    }
  };

  // ✅ Delete chapel
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this chapel?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/chapel/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChapels(chapels.filter((c) => c.chapelID !== id));
    } catch {
      setError("Failed to delete chapel");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold mb-4">⛪ Chapel Room Management</h2>

      {/* Add new chapel form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow flex flex-wrap gap-3"
      >
        <input
          type="text"
          placeholder="Chapel Name"
          value={form.chapelName}
          onChange={(e) => setForm({ ...form, chapelName: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[200px]"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <button
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Chapel"}
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {/* Chapel table */}
      <table className="min-w-full bg-white shadow rounded">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 text-left">Chapel Name</th>
            <th className="py-2 px-4 text-left">Description</th>
            <th className="py-2 px-4 text-left">Status</th>
            <th className="py-2 px-4 text-left">Created At</th>
            <th className="py-2 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapels.map((c) => (
            <tr key={c.chapelID} className="border-t hover:bg-gray-50">
              <td className="py-2 px-4">{c.chapelName}</td>
              <td className="py-2 px-4">{c.description}</td>
              <td className="py-2 px-4">{c.status}</td>
              <td className="py-2 px-4">{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="py-2 px-4 text-center flex gap-2 justify-center">
                <select
                  onChange={(e) => handleStatusChange(c.chapelID, e.target.value)}
                  value={c.status}
                  className="border p-1 rounded"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                <button
                  onClick={() => handleDelete(c.chapelID)}
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