// src/pages/cashier_dashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function CashierDashboard() {
  const { user, token } = useAuth();
  const [chapels, setChapels] = useState([]);
  const [selectedChapel, setSelectedChapel] = useState(null);
  const [fnbItems, setFnbItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [loadingChapels, setLoadingChapels] = useState(true);
  const [loadingFnb, setLoadingFnb] = useState(false);
  const [error, setError] = useState("");

  // Fetch available chapels
  useEffect(() => {
    if (!token) return;
    setLoadingChapels(true);
    axios
      .get("http://localhost:5000/api/chapel/available", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setChapels(res.data.data || []);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to fetch chapels:", err);
        setError("Failed to fetch chapels");
      })
      .finally(() => setLoadingChapels(false));
  }, [token]);

  // Fetch F&B items when chapel is selected
  useEffect(() => {
    if (!selectedChapel) return;
    setLoadingFnb(true);
    axios
      .get(`http://localhost:5000/api/fnb?chapelID=${selectedChapel.chapelID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFnbItems(res.data.data || []);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to fetch F&B items:", err);
        setError("Failed to fetch F&B items");
      })
      .finally(() => setLoadingFnb(false));
  }, [selectedChapel, token]);

  const handleAddItem = (item) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (itemID) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemID));
  };

  const handleRegistration = () => {
    if (!selectedChapel || selectedItems.length === 0 || !clientInfo.name) {
      alert("Please complete all steps before registering.");
      return;
    }

    const payload = {
      chapelID: selectedChapel.chapelID,
      items: selectedItems.map((i) => ({ id: i.id, quantity: i.quantity || 1 })),
      client: clientInfo,
    };

    axios
      .post("http://localhost:5000/api/registrations", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Registration completed!");
        setSelectedChapel(null);
        setSelectedItems([]);
        setClientInfo({ name: "", email: "", phone: "" });
      })
      .catch((err) => {
        console.error("Registration failed:", err);
        alert("Registration failed. Check console for details.");
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Cashier Dashboard — {user?.email}
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Step 1: Select Chapel */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select Chapel</h2>
        {loadingChapels ? (
          <p>Loading chapels...</p>
        ) : (
          <select
            value={selectedChapel?.chapelID || ""}
            onChange={(e) =>
              setSelectedChapel(chapels.find((c) => c.chapelID === parseInt(e.target.value)))
            }
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Chapel --</option>
            {chapels.map((chapel) => (
              <option key={chapel.chapelID} value={chapel.chapelID}>
                {chapel.chapelName} — Status: {chapel.status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2: F&B items */}
      {selectedChapel && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Select F&B Items</h2>
          {loadingFnb ? (
            <p>Loading items...</p>
          ) : (
            <ul>
              {fnbItems.map((item) => (
                <li key={item.id} className="flex justify-between mb-1">
                  <span>{item.name}</span>
                  <button
                    onClick={() => handleAddItem(item)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedItems.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold">Selected Items:</h3>
              <ul>
                {selectedItems.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.name}</span>
                    <button
                      onClick={() => handleRemoveItem(i.id)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Client info */}
      {selectedChapel && selectedItems.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Client Registration</h2>
          <input
            type="text"
            placeholder="Name"
            value={clientInfo.name}
            onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
            className="border p-2 rounded mb-2 w-full"
          />
          <input
            type="email"
            placeholder="Email"
            value={clientInfo.email}
            onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
            className="border p-2 rounded mb-2 w-full"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={clientInfo.phone}
            onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
            className="border p-2 rounded mb-2 w-full"
          />
          <button
            onClick={handleRegistration}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Complete Registration
          </button>
        </div>
      )}
    </div>
  );
}
