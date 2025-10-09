import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth_context";

export default function Fnb() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageItems, setPackageItems] = useState([]);
  const [form, setForm] = useState({
    categoryName: "",
    description: "",
    productName: "",
    price: "",
    size: "",
    image: "",
    categoryID: "",
    packageName: "",
    totalValue: "",
    packageProduct: "",
    quantity: "",
  });

  // Load all F&B data
  const loadData = async () => {
    try {
      const [catRes, prodRes, pkgRes] = await Promise.all([
        axios.get("http://localhost:5000/api/fnb/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/fnb/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/fnb/packages", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setPackages(pkgRes.data.data || []);
    } catch (err) {
      console.error("Error loading F&B data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category creation
  const createCategory = async () => {
    if (!form.categoryName) return alert("Enter category name");
    await axios.post(
      "http://localhost:5000/api/fnb/categories",
      {
        categoryName: form.categoryName,
        description: form.description,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setForm({ ...form, categoryName: "", description: "" });
    loadData();
  };

  // Product creation
  const createProduct = async () => {
    if (!form.productName || !form.price || !form.categoryID)
      return alert("Enter product details");

    const payload = {
      categoryID: parseInt(form.categoryID),
      productName: form.productName,
      price: parseFloat(form.price),
      description: form.description || "",
      size: form.size || null,
      image: form.image || null,
      isAvailable: true,
    };

    await axios.post("http://localhost:5000/api/fnb/products", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setForm({
      ...form,
      productName: "",
      price: "",
      image: "",
      size: "",
    });
    loadData();
  };

  // Package creation
  const createPackage = async () => {
    if (!form.packageName || !form.totalValue)
      return alert("Enter package details");
    await axios.post(
      "http://localhost:5000/api/fnb/packages",
      {
        packageName: form.packageName,
        description: form.description || "",
        totalValue: parseFloat(form.totalValue),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setForm({ ...form, packageName: "", totalValue: "" });
    loadData();
  };

  // Load package items
  const viewPackageItems = async (pkg) => {
  setSelectedPackage(pkg);
  try {
    const res = await axios.get(
      `http://localhost:5000/api/fnb/packages/${pkg.packageID}/items`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPackageItems(res.data.data || []);
  } catch (err) {
    console.error("Error fetching package items", err.response?.data || err.message);
    setPackageItems([]);
  }
};

  // Add product to package
  const addProductToPackage = async () => {
    if (!selectedPackage) return alert("Select a package first");
    if (!form.packageProduct || !form.quantity)
      return alert("Select product and quantity");

    await axios.post(
      `http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items`,
      {
        productID: parseInt(form.packageProduct),
        quantity: parseInt(form.quantity),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Clear form & reload items
    setForm({ ...form, packageProduct: "", quantity: "" });
    viewPackageItems(selectedPackage);
  };

  // Remove product from package
  const removeItemFromPackage = async (item) => {
    if (
      !window.confirm(
        `Remove ${item.productName} (x${item.quantity}) from ${selectedPackage.packageName}?`
      )
    )
      return;
    await axios.delete(
      `http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items/${item.packageItemID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    viewPackageItems(selectedPackage);
  };

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">🍴 F&B Management</h1>

      {/* CATEGORIES */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl mb-3 font-semibold">1️⃣ Categories</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="text"
            placeholder="Category Name"
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-2 rounded"
          />
          <button
            onClick={createCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Category
          </button>
        </div>
        <ul className="list-disc ml-6">
          {categories.map((c) => (
            <li key={c.categoryID}>{c.categoryName}</li>
          ))}
        </ul>
      </section>

      {/* PRODUCTS */}
      <section className="bg-white p-5 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold">2️⃣ Products</h2>

        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={form.categoryID || ""}
            onChange={(e) => setForm({ ...form, categoryID: e.target.value })}
            className="border p-2 rounded w-48"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.categoryID} value={c.categoryID}>
                {c.categoryName}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Product Name"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.size || ""}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="border p-2 rounded w-32"
          >
            <option value="">Select Size</option>
            <option value="8oz">8oz</option>
            <option value="12oz">12oz</option>
            <option value="16oz">16oz</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setForm({ ...form, image: reader.result });
                };
                reader.readAsDataURL(file);
              }
            }}
            className="border p-2 rounded w-60"
          />
          <button
            onClick={createProduct}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Product
          </button>
        </div>

        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Size</th>
              <th className="p-2 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productID} className="border-t">
                <td className="p-2">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.productName}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </td>
                <td className="p-2">{p.productName}</td>
                <td className="p-2">{p.categoryName}</td>
                <td className="p-2">{p.size}</td>
                <td className="p-2">₱{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* PACKAGES */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl mb-3 font-semibold">3️⃣ Packages</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="text"
            placeholder="Package Name"
            value={form.packageName}
            onChange={(e) => setForm({ ...form, packageName: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Total Value"
            value={form.totalValue}
            onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
            className="border p-2 rounded"
          />
          <button
            onClick={createPackage}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Package
          </button>
        </div>

        {packages.map((pkg) => (
          <div
            key={pkg.packageID}
            className="border rounded p-3 mb-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => viewPackageItems(pkg)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {pkg.packageName} - ₱{pkg.totalValue}
              </h3>
            </div>

            {selectedPackage?.packageID === pkg.packageID && (
              <div className="mt-3">
                <div className="flex gap-2 mb-3">
                  <select
                    value={form.packageProduct || ""}
                    onChange={(e) =>
                      setForm({ ...form, packageProduct: e.target.value })
                    }
                    className="border p-2 rounded w-60"
                  >
                    <option value="">Select a product</option>
                    {products.map((p) => (
                      <option key={p.productID} value={p.productID}>
                        {p.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="border p-2 rounded w-24"
                  />
                  <button
                    onClick={addProductToPackage}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    ➕ Add Product
                  </button>
                </div>

                <table className="w-full text-sm border rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageItems.length > 0 ? (
                      packageItems.map((item) => (
                        <tr key={item.packageItemID} className="border-t">
                          <td className="p-2">{item.productName}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => removeItemFromPackage(item)}
                              className="text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center p-3 text-gray-400"
                        >
                          No items yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
