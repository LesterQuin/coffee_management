import { useState } from "react";
import { useAuth } from "../context/auth_context";
import ChapelSelector from "../components/ChapelSelector";
import FnbSelector from "../components/FnbSelector";
import ClientForm from "../components/ClientForm";

export default function CashierDashboard() {
  const { user, token } = useAuth();
  const [selectedChapel, setSelectedChapel] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Cashier Dashboard — {user?.email}
      </h1>

      {/* Step 1: Select Chapel */}
      <ChapelSelector token={token} selectedChapel={selectedChapel} setSelectedChapel={setSelectedChapel} />

      {/* Step 2: Select F&B Items */}
      {selectedChapel && (
        <FnbSelector
          token={token}
          selectedChapel={selectedChapel}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
        />
      )}

      {/* Step 3: Client Registration */}
      {selectedChapel && selectedItems.length > 0 && (
        <ClientForm
          token={token}
          selectedChapel={selectedChapel}
          selectedItems={selectedItems}
          clientInfo={clientInfo}
          setClientInfo={setClientInfo}
          setSelectedChapel={setSelectedChapel}
          setSelectedItems={setSelectedItems}
          setClientInfoState={setClientInfo}
        />
      )}
    </div>
  );
}
