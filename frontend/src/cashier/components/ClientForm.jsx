// src/cashier/components/ClientForm.jsx
import { useState } from "react";
import axios from "axios";

export default function ClientForm({ token, selectedChapel, selectedPackage, resetSelection }) {
  const [clientInfo, setClientInfo] = useState({
    deceasedName: "",
    registeredBy: "",
    mobileNo: "",
    email: "",
    address: "",
    scheduleFrom: "",
    scheduleTo: "",
  });
  const [pin, setPin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrPayload, setQrPayload] = useState(null); // parsed QR payload
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientInfo(prev => {
      const updated = { ...prev, [name]: value };
      if (updated.scheduleFrom && updated.scheduleTo) {
        const from = new Date(updated.scheduleFrom);
        const to = new Date(updated.scheduleTo);
        if (to < from) {
          alert("End date cannot be before start date.");
          updated.scheduleTo = "";
        }
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!clientInfo.deceasedName || !clientInfo.registeredBy || !clientInfo.mobileNo) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...clientInfo,
        chapelID: selectedChapel.chapelID,
        chapelName: selectedChapel.chapelName,   // send name
        packageNo: selectedPackage.packageID,
        packageName: selectedPackage.packageName  // send name
      };

      const res = await axios.post(
        "http://localhost:5000/api/clients/register",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Backend returns pin, qrDataUrl, sessionID
      setPin(res.data.data.pin);
      setQrDataUrl(res.data.data.qrDataUrl);
      setQrPayload(res.data.data.qrPayload);

      // Parse QR payload JSON for display
      try {
        setQrPayload(JSON.parse(atob(res.data.data.qrDataUrl.split(",")[1])));
      } catch {
        setQrPayload(null);
      }
      setRegistered(true);

      // Reset form
      setClientInfo({
        deceasedName: "",
        registeredBy: "",
        mobileNo: "",
        email: "",
        address: "",
        scheduleFrom: "",
        scheduleTo: "",
      });

      alert("Client registered successfully!");
      setTimeout(() => resetSelection(), 10000);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow-md space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      <h2 className="text-lg font-semibold">Client Registration</h2>

      <input
        type="text"
        name="deceasedName"
        placeholder="Name of Deceased"
        value={clientInfo.deceasedName}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        name="registeredBy"
        placeholder="Name of Registrar"
        value={clientInfo.registeredBy}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />
      <input
        type="tel"
        name="mobileNo"
        placeholder="Mobile No."
        value={clientInfo.mobileNo}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />
      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={clientInfo.email}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={clientInfo.address}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />
      <div className="flex space-x-2">
        <input
          type="date"
          name="scheduleFrom"
          value={clientInfo.scheduleFrom}
          onChange={handleChange}
          className="border p-2 rounded flex-1"
        />
        <input
          type="date"
          name="scheduleTo"
          value={clientInfo.scheduleTo}
          onChange={handleChange}
          className="border p-2 rounded flex-1"
          min={clientInfo.scheduleFrom}
        />
      </div>

      <input
        type="text"
        value={`Chapel: ${selectedChapel.chapelName}, Package: ${selectedPackage.packageName}`}
        readOnly
        className="border p-2 rounded w-full bg-gray-100"
      />

      {registered && qrPayload && (
        <div className="text-sm bg-gray-100 p-2 rounded">
          <p><strong>QR Info:</strong></p>
          <p>Deceased: {qrPayload.deceasedName}</p>
          <p>Chapel: {qrPayload.chapelName} (ID: {qrPayload.chapelID})</p>
          <p>Package: {qrPayload.packageName} (ID: {qrPayload.packageNo})</p>
          <p>PIN: {qrPayload.pin}</p>
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Registering..." : "Complete Registration"}
      </button>
    </div>
  );
}
