import { useEffect, useState } from "react";
import axios from "axios";

export default function ChapelSelector({ token, selectedChapel, setSelectedChapel }) {
  const [chapels, setChapels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios
      .get("http://localhost:5000/api/chapels", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setChapels(res.data || []))
      .catch(() => setError("Failed to fetch chapels"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-gray-500 mb-4">Loading chapels...</p>;
  if (error) return <p className="text-red-500 mb-4">{error}</p>;

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Select Chapel</h2>
      <select
        value={selectedChapel?.id || ""}
        onChange={(e) =>
          setSelectedChapel(chapels.find((c) => c.id === parseInt(e.target.value)))
        }
        className="border p-2 rounded w-full"
      >
        <option value="">-- Select Chapel --</option>
        {chapels.map((chapel) => (
          <option key={chapel.id} value={chapel.id}>
            {chapel.name}
          </option>
        ))}
      </select>
    </div>
  );
}
