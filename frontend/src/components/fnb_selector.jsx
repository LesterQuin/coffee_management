import { useEffect, useState } from "react";
import axios from "axios";

export default function FnbSelector({ token, selectedChapel, selectedItems, setSelectedItems }) {
  const [fnbItems, setFnbItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedChapel) return;

    setLoading(true);
    axios
      .get(`http://localhost:5000/api/fnb?chapelID=${selectedChapel.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFnbItems(res.data || []))
      .catch(() => setError("Failed to fetch F&B items"))
      .finally(() => setLoading(false));
  }, [selectedChapel, token]);

  const handleAddItem = (item) => {
    setSelectedItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemID) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemID));
  };

  const handleQuantityChange = (itemID, quantity) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === itemID ? { ...i, quantity } : i))
    );
  };

  if (loading) return <p className="text-gray-500 mb-4">Loading F&B items...</p>;
  if (error) return <p className="text-red-500 mb-4">{error}</p>;

  return (
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
              <li key={i.id} className="flex justify-between items-center mb-1">
                <span>{i.name}</span>
                <input
                  type="number"
                  min="1"
                  value={i.quantity}
                  onChange={(e) => handleQuantityChange(i.id, parseInt(e.target.value))}
                  className="border p-1 rounded w-16 mr-2"
                />
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
  );
}
