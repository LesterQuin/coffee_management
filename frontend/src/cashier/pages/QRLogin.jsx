// cashier/pages/qrlogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QrReader from "react-qr-reader"; // make sure to install react-qr-reader
import axios from "axios";

export default function QRLogin({ token, onLoginSuccess }) {
  const [scannedData, setScannedData] = useState(null);
  const [userName, setUserName] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle QR scan
  const handleScan = (data) => {
    if (!data) return;
    try {
      const payload = JSON.parse(data); // QR contains {pin, chapelName, packageNo, deceasedName}
      setScannedData(payload);
      setInputPin(""); // reset PIN
      setUserName(""); // reset name
      setError("");
    } catch (err) {
      console.error("Invalid QR", err);
      setError("Scanned QR is invalid");
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError("QR scanning failed");
  };

  // Validate PIN + Name
  const validateLogin = async () => {
    if (!userName || !inputPin) {
      setError("Please enter your name and PIN");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/clients/validate-pin",
        {
          pin: inputPin,
          name: userName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Login success → navigate to order page
        const { packageNo, packageName, clientID } = res.data.clientData;
        alert(`Login successful! Proceed to order ${packageName}`);
        navigate(`/order/${clientID}`, { state: { packageNo, packageName } });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Validation failed");
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow-md space-y-4">
      <h2 className="text-lg font-semibold">Client Login via QR</h2>

      {!scannedData && (
        <div>
          <p>Scan QR Code:</p>
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
          />
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}

      {scannedData && (
        <div className="space-y-2">
          <p><strong>Scanned Info:</strong></p>
          <p>Deceased: {scannedData.deceasedName}</p>
          <p>Chapel: {scannedData.chapelName}</p>
          <p>Package No: {scannedData.packageNo}</p>

          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Enter PIN"
            value={inputPin}
            onChange={(e) => setInputPin(e.target.value)}
            className="border p-2 rounded w-full"
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            onClick={validateLogin}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Login & Order
          </button>
          <button
            onClick={() => setScannedData(null)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mt-2"
          >
            Rescan QR
          </button>
        </div>
      )}
    </div>
  );
}
