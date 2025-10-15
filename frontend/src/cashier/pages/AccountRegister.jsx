import { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/auth_context";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "Invalid Date";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function AccountRegister() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null); // QR view
  const [editClient, setEditClient] = useState(null); // Edit modal

  // Fetch clients
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    axios
      .get("http://localhost:5000/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClients(res.data.data || []);
        setError("");
      })
      .catch((err) => {
        console.error("Error fetching clients:", err);
        setError("Failed to fetch registered clients.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Delete client
  const handleDelete = async (clientID) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/clients/${clientID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(clients.filter((c) => c.clientID !== clientID));
    } catch (err) {
      console.error("Error deleting client:", err);
      setError("Failed to delete client.");
    } finally {
      setLoading(false);
    }
  };

  // Update client
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { clientID, deceasedName, mobileNo, email, address } = editClient;

      await axios.put(
        "http://localhost:5000/api/clients/update",
        { clientID, deceasedName, mobileNo, email, address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update client in state
      setClients(clients.map((c) => (c.clientID === clientID ? editClient : c)));
      setEditClient(null);
    } catch (err) {
      console.error("Error updating client:", err);
      setError("Failed to update client.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-4">Loading clients...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-600">Account Register</h1>

      {clients.length === 0 ? (
        <p>No registered clients found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">#</th>
              <th className="border p-2">Deceased Name</th>
              <th className="border p-2">Registered By</th>
              <th className="border p-2">Mobile No</th>
              <th className="border p-2">Schedule</th>
              <th className="border p-2">Chapel</th>
              <th className="border p-2">Package</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, index) => (
              <tr key={c.clientID || index} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">{c.deceasedName}</td>
                <td className="border p-2">{c.registeredBy}</td>
                <td className="border p-2">{c.mobileNo}</td>
                <td className="border p-2">
                  {formatDate(c.scheduleFrom || c.schedule_from)} -{" "}
                  {formatDate(c.scheduleTo || c.schedule_to)}
                </td>
                <td className="border p-2">{c.chapelName || "N/A"}</td>
                <td className="border p-2">{c.packageName || "N/A"}</td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => setSelectedClient(c)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    View QR
                  </button>
                  <button
                    onClick={() => setEditClient(c)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(c.clientID)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* QR & PIN Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-96 relative">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-3">Client PIN & QR</h2>
            <p className="mb-2">
              <strong>Name:</strong> {selectedClient.deceasedName}
            </p>
            <p className="mb-2">
              <strong>PIN:</strong>{" "}
              <span className="text-xl font-bold">{selectedClient.pin}</span>
            </p>

            <div className="flex justify-center">
              <QRCodeSVG value={selectedClient.pin || ""} size={160} />
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setSelectedClient(null)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-96 relative">
            <button
              onClick={() => setEditClient(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black text-lg"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-3">Update Client</h2>

            <div className="space-y-3">
              <input
                type="text"
                value={editClient.deceasedName}
                onChange={(e) =>
                  setEditClient({ ...editClient, deceasedName: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="Deceased Name"
              />
              <input
                type="text"
                value={editClient.mobileNo}
                onChange={(e) =>
                  setEditClient({ ...editClient, mobileNo: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="Mobile No"
              />
              <input
                type="email"
                value={editClient.email}
                onChange={(e) =>
                  setEditClient({ ...editClient, email: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="Email"
              />
              <input
                type="text"
                value={editClient.address}
                onChange={(e) =>
                  setEditClient({ ...editClient, address: e.target.value })
                }
                className="w-full border p-2 rounded"
                placeholder="Address"
              />

              {/* Schedule From */}
              <label className="block text-sm font-medium">Schedule From</label>
              <input
                type="datetime-local"
                value={
                  editClient.scheduleFrom
                    ? new Date(editClient.scheduleFrom)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEditClient({ ...editClient, scheduleFrom: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              {/* Schedule To */}
              <label className="block text-sm font-medium">Schedule To</label>
              <input
                type="datetime-local"
                value={
                  editClient.scheduleTo
                    ? new Date(editClient.scheduleTo).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEditClient({ ...editClient, scheduleTo: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mt-4 text-center space-x-2">
              <button
                onClick={handleUpdate}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Save
              </button>
              <button
                onClick={() => setEditClient(null)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
