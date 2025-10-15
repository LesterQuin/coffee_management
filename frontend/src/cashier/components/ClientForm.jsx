// src/cashier/components/ClientForm.jsx
import { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false); // Track if registration succeeded

  const handleChange = (e) => {
    const { name, value } = e.target;

    setClientInfo((prev) => {
      const updated = { ...prev, [name]: value };

      // Validate that scheduleTo is not earlier than scheduleFrom
      if (updated.scheduleFrom && updated.scheduleTo) {
        const fromDate = new Date(updated.scheduleFrom);
        const toDate = new Date(updated.scheduleTo);
        if (toDate < fromDate) {
          alert("End date cannot be before start date.");
          updated.scheduleTo = ""; // reset invalid date
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

    if (clientInfo.scheduleFrom && clientInfo.scheduleTo) {
      const fromDate = new Date(clientInfo.scheduleFrom);
      const toDate = new Date(clientInfo.scheduleTo);
      if (toDate < fromDate) {
        alert("End date cannot be before start date.");
        return;
      }
    }

    const newPin = Math.floor(100000 + Math.random() * 900000).toString();

    const payload = {
      ...clientInfo,
      chapelID: selectedChapel.chapelID,
      packageNo: selectedPackage.packageID,
      pin: newPin,
    };

    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/clients/register", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPin(newPin); // set the PIN
      setRegistered(true); // show QR and PIN

      // Reset form for next client
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
      setTimeout(() => {
        resetSelection();
      }, 10000);
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

      {/* Show PIN and QR only after registration */}
      {registered && (
        <div className="flex items-center space-x-4">
          <div>
            <p className="font-semibold">Generated PIN:</p>
            <p className="text-xl font-bold">{pin}</p>
          </div>
          <QRCodeSVG value={pin} size={128} />
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
