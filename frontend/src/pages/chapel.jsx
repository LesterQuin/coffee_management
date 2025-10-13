import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Chapel() {
  const { token } = useAuth();
  const [chapels, setChapels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [form, setForm] = useState({
    chapelName: "",
    description: "",
    status: "Available",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load chapels
  const fetchChapels = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/chapel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setChapels(res.data.data);
    } catch {
      setError("Failed to load chapel rooms");
    }
  };

  useEffect(() => {
    fetchChapels();
  }, []);

  // Create new chapel
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

  // Start editing
  const handleEdit = (chapel) => {
    setEditingId(chapel.chapelID);
    setEditData({
      chapelName: chapel.chapelName,
      description: chapel.description,
      status: chapel.status,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save edit
  const saveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/chapel/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingId(null);
      fetchChapels();
    } catch {
      setError("Failed to update chapel");
    }
  };

  // Delete chapel
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
    <div>
      <h2>Chapel Room Management</h2>

      {/* Add new chapel */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Chapel Name"
          value={form.chapelName}
          onChange={(e) => setForm({ ...form, chapelName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <button disabled={loading}>
          {loading ? "Saving..." : "Add Chapel"}
        </button>
      </form>

      {error && <p>{error}</p>}

      {/* Chapel list */}
      <table>
        <thead>
          <tr>
            <th>Chapel Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapels.map((c) => (
            <tr key={c.chapelID}>
              {editingId === c.chapelID ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editData.chapelName}
                      onChange={(e) =>
                        setEditData({ ...editData, chapelName: e.target.value })
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => saveEdit(c.chapelID)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{c.chapelName}</td>
                  <td>{c.description}</td>
                  <td>{c.status}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleEdit(c)}>Edit</button>
                    <button onClick={() => handleDelete(c.chapelID)}>
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
