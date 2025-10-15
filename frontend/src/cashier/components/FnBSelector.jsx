import { useEffect, useState } from "react";
import axios from "axios";

export default function FnbSelector({ token, selectedChapel, selectedItems, setSelectedItems }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedChapel) return;
    setLoading(true);

    axios
      .get(`http://localhost:5000/api/fnb?chapelID=${selectedChapel.chapelID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setItems(res.data.data || []);
        setError("");
      })
      .catch(() => setError("Failed to fetch F&B items"))
      .finally(() => setLoading(false));
  }, [selectedChapel, token]);

  const handleAdd = (item) => setSelectedItems((prev) => [...prev, item]);
  const handleRemove = (id) => setSelectedItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Select F&B Items</h2>
      {loading ? (
        <p>Loading items...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex justify-between mb-1">
              <span>{item.name}</span>
              <button
                onClick={() => handleAdd(item)}
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
                <button onClick={() => handleRemove(i.id)} className="text-red-500">
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
