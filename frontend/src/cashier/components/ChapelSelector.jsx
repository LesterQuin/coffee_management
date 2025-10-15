// src/cashier/components/ChapelSelector.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function ChapelSelector({ token, selectedChapel, setSelectedChapel, selectedPackage, setSelectedPackage }) {
  const [chapels, setChapels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingChapels, setLoadingChapels] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState("");

  // Fetch available chapels on mount
  useEffect(() => {
    if (!token) return;
    setLoadingChapels(true);
    axios
      .get("http://localhost:5000/api/chapel/available", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setChapels(res.data.data || []);
        setError("");
      })
      .catch(err => {
        console.error("Failed to fetch chapels:", err);
        setError("Failed to fetch chapels");
      })
      .finally(() => setLoadingChapels(false));
  }, [token]);

  // Fetch packages whenever a chapel is selected
  useEffect(() => {
    if (!selectedChapel) {
      setPackages([]);
      setSelectedPackage(null);
      return;
    }

    setLoadingPackages(true);
    axios
      .get(`http://localhost:5000/api/packages?chapelID=${selectedChapel.chapelID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setPackages(res.data.data || []);
        setSelectedPackage(null); // reset package selection
        setError("");
      })
      .catch(err => {
        console.error("Failed to fetch packages:", err);
        setError("Failed to fetch packages");
      })
      .finally(() => setLoadingPackages(false));
  }, [selectedChapel, token, setSelectedPackage]);

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      {/* Chapel Select */}
      <div>
        <label className="block font-semibold mb-1">Select Chapel:</label>
        {loadingChapels ? (
          <p>Loading chapels...</p>
        ) : (
          <select
            value={selectedChapel?.chapelID || ""}
            onChange={e =>
              setSelectedChapel(chapels.find(c => c.chapelID === parseInt(e.target.value)))
            }
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Chapel --</option>
            {chapels.map(chapel => (
              <option key={chapel.chapelID} value={chapel.chapelID}>
                {chapel.chapelName} — Status: {chapel.status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Package Select */}
      {selectedChapel && (
        <div>
          <label className="block font-semibold mb-1">Select Package:</label>
          {loadingPackages ? (
            <p>Loading packages...</p>
          ) : packages.length === 0 ? (
            <p>No packages available for this chapel.</p>
          ) : (
            <select
              value={selectedPackage?.packageID || ""}
              onChange={e =>
                setSelectedPackage(packages.find(p => p.packageID === parseInt(e.target.value)))
              }
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Package --</option>
              {packages.map(pkg => (
                <option key={pkg.packageID} value={pkg.packageID}>
                  {pkg.packageName}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
