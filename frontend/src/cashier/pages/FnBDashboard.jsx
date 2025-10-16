import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth_context";

export default function FnbDashboard() {
  const { token } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageItems, setPackageItems] = useState([]);
  const [editQuantity, setEditQuantity] = useState({});

  // Fetch all packages
  const fetchPackages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/fnb/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages(res.data.data || []);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  useEffect(() => {
    if (token) fetchPackages();
  }, [token]);

  // View package items
  const viewItems = async (pkg) => {
    setSelectedPackage(pkg);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/fnb/packages/${pkg.packageID}/items`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPackageItems(res.data.data.items || []);
    } catch (err) {
      console.error("Error fetching package items:", err);
    }
  };

  // Update quantity of an item
  const updateQuantity = async (item) => {
    const newQty = editQuantity[item.packageItemID];
    if (!newQty || newQty <= 0)
      return alert("Please enter a valid quantity before updating.");

    try {
      const res = await axios.put(
        `http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items/${item.packageItemID}`,
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("Item quantity updated!");
        viewItems(selectedPackage); // Refresh items
      } else {
        alert(res.data.message || "Failed to update item.");
      }
    } catch (err) {
      console.error("Failed to update item quantity:", err);
      alert("Failed to update item.");
    }
  };

  // Remove item from package
  const removeItem = async (item) => {
    if (!window.confirm(`Remove ${item.productName} from this package?`)) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items/${item.packageItemID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Item removed from package.");
      viewItems(selectedPackage);
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">
        🍽️ F&B Dashboard (Cashier View)
      </h2>
      <p className="text-gray-700">
        Manage existing packages and their products below.
      </p>

      {/* Package List */}
      {packages.length === 0 ? (
        <p className="text-gray-500">No packages found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Package Name</th>
              <th className="border p-2">Total Value</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg, index) => (
              <tr key={pkg.packageID}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">{pkg.packageName}</td>
                <td className="border p-2">₱{pkg.totalValue}</td>
                <td className="border p-2">
                  {pkg.createdAt
                    ? new Date(pkg.createdAt).toLocaleString("en-PH")
                    : "—"}
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => viewItems(pkg)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    View Items
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Package Items */}
      {selectedPackage && (
        <div className="mt-8 border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">
              Package: {selectedPackage.packageName}
            </h3>
            <button
              onClick={() => setSelectedPackage(null)}
              className="text-red-600 hover:underline"
            >
              Close
            </button>
          </div>

          {packageItems.length === 0 ? (
            <p className="text-gray-500">No items in this package.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Product Name</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Updated At</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packageItems.map((item) => (
                  <tr key={item.packageItemID}>
                    <td className="border p-2">{item.productName}</td>
                    <td className="border p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={editQuantity[item.packageItemID] ?? item.quantity}
                        onChange={(e) =>
                          setEditQuantity((prev) => ({
                            ...prev,
                            [item.packageItemID]: e.target.value,
                          }))
                        }
                        className="border rounded px-2 py-1 w-20 text-center"
                      />
                    </td>
                    <td className="border p-2 text-center text-gray-600">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleString("en-PH")
                        : "—"}
                    </td>
                    <td className="border p-2 text-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => removeItem(item)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
