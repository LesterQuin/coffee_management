// src/cashier/pages/ChapelDashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth_context";
import ChapelSelector from "../components/ChapelSelector";
import PackageSelector from "../components/PackageSelector";
import ClientForm from "../components/ClientForm";

export default function ChapelDashboard() {
  const { token } = useAuth();
  const [selectedChapel, setSelectedChapel] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const resetSelection = () => {
    setSelectedChapel(null);
    setPackages([]);
    setSelectedPackage(null);
  };

  // Fetch packages when chapel is selected
  useEffect(() => {
    if (!selectedChapel || !token) return;

    axios
      .get(`http://localhost:5000/api/packages?chapelID=${selectedChapel.chapelID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPackages(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch packages:", err);
      });
  }, [selectedChapel, token]);

  return (
    <div className="space-y-6 p-6">
      {/* Step 1: Select Chapel */}
      <ChapelSelector
        token={token}
        selectedChapel={selectedChapel}
        setSelectedChapel={setSelectedChapel}
      />

      {/* Step 2: Select Package */}
      {selectedChapel && (
        <PackageSelector
          packages={packages}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
        />
      )}

      {/* Step 3: Client Registration Form */}
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
