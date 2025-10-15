import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth_context";
import axios from "axios";
import ClientForm from "../components/ClientForm";

export default function ChapelDashboard() {
  const { token } = useAuth();
  const [chapels, setChapels] = useState([]);
  const [selectedChapel, setSelectedChapel] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [error, setError] = useState("");
  const [loadingChapels, setLoadingChapels] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Fetch all available chapels
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
        console.error(err);
        setError("Failed to fetch chapels");
      })
      .finally(() => setLoadingChapels(false));
  }, [token]);

  // Fetch all F&B packages (global)
  useEffect(() => {
    if (!token) return;
    setLoadingPackages(true);

    axios
      .get("http://localhost:5000/api/fnb/packages", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPackages(res.data.data || []);
        setSelectedPackage(null); // Reset previously selected package
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch packages");
      })
      .finally(() => setLoadingPackages(false));
  }, [token]);

  const resetSelection = () => {
    setSelectedChapel(null);
    setSelectedPackage(null);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-600">Chapel Dashboard</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* Step 1: Select Chapel */}
      <div>
        <h2 className="font-semibold mb-2">Select Chapel</h2>
        {loadingChapels ? (
          <p>Loading chapels...</p>
        ) : (
          <select
            value={selectedChapel?.chapelID || ""}
            onChange={(e) =>
              setSelectedChapel(
                chapels.find((c) => c.chapelID === parseInt(e.target.value))
              )
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

      {/* Step 2: Select Package */}
      {selectedChapel && (
        <div>
          <h2 className="font-semibold mb-2">Select Package</h2>
          {loadingPackages ? (
            <p>Loading packages...</p>
          ) : (
            <select
              value={selectedPackage?.packageID || ""}
              onChange={(e) =>
                setSelectedPackage(
                  packages.find((p) => p.packageID === parseInt(e.target.value))
                )
              }
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Package --</option>
              {packages.map((p) => (
                <option key={p.packageID} value={p.packageID}>
                  {p.packageName} - ₱{p.totalValue}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 3: Show Client Form */}
      {selectedChapel && selectedPackage && (
        <ClientForm
          token={token}
          selectedChapel={selectedChapel}
          selectedPackage={selectedPackage}
          resetSelection={resetSelection}
        />
      )}
    </div>
  );
}
