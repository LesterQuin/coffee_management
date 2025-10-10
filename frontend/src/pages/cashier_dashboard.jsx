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

  // Fetch chapels created by Admin
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/chapels", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setChapels(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  // Fetch F&B items for selected chapel
  useEffect(() => {
    if (!selectedChapel) return;
    axios
      .get(`http://localhost:5000/api/fnb?chapelID=${selectedChapel.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFnbItems(res.data))
      .catch((err) => console.error(err));
  }, [selectedChapel, token]);

  const handleAddItem = (item) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleRemoveItem = (itemID) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemID));
  };

  const handleRegistration = () => {
    const payload = {
      chapelID: selectedChapel.id,
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
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Cashier Dashboard — {user?.email}
      </h1>

      {/* Step 1: Select Chapel */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select Chapel</h2>
        <select
          value={selectedChapel?.id || ""}
          onChange={(e) =>
            setSelectedChapel(chapels.find((c) => c.id === parseInt(e.target.value)))
          }
          className="border p-2 rounded"
        >
          <option value="">-- Select Chapel --</option>
          {chapels.map((chapel) => (
            <option key={chapel.id} value={chapel.id}>
              {chapel.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Select F&B Items */}
      {selectedChapel && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Select F&B Items</h2>
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

      {/* Step 3: Registration Form */}
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
