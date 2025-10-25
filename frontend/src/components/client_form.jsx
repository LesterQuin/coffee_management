import axios from "axios";

export default function ClientForm({
  token,
  selectedChapel,
  selectedItems,
  clientInfo,
  setClientInfo,
  setSelectedChapel,
  setSelectedItems,
  setClientInfoState
}) {
  const handleRegistration = () => {
    const payload = {
      chapelID: selectedChapel.id,
      items: selectedItems.map((i) => ({ id: i.id, quantity: i.quantity })),
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
        setClientInfoState({ name: "", email: "", phone: "" });
      })
      .catch(() => alert("Registration failed"));
  };

  return (
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
        disabled={!selectedChapel || selectedItems.length === 0}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Complete Registration
      </button>
    </div>
  );
}
