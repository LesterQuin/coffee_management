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

  // Forms
  const [categoryForm, setCategoryForm] = useState({ categoryName: "", description: "" });
  const [productForm, setProductForm] = useState({ categoryID: "", productName: "", price: "", size: "" });
  const [packageForm, setPackageForm] = useState({ packageName: "", totalValue: "" });
  const [packageItemForm, setPackageItemForm] = useState({ productID: "", quantity: "" });

  // Editing states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  // ----------------- Load Data -----------------
  const loadData = async () => {
    try {
      const [catRes, prodRes, pkgRes] = await Promise.all([
        axios.get("http://localhost:5000/api/fnb/categories", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/fnb/products", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/fnb/packages", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setPackages(pkgRes.data.data || []);
    } catch (err) {
      console.error("Error loading F&B data", err.response?.data || err.message);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ----------------- Category CRUD -----------------
  const createCategory = async () => {
    if (!categoryForm.categoryName) return alert("Enter category name");
    await axios.post("http://localhost:5000/api/fnb/categories", categoryForm, { headers: { Authorization: `Bearer ${token}` } });
    setCategoryForm({ categoryName: "", description: "" });
    loadData();
  };

  const updateCategory = async (categoryID) => {
    await axios.put(`http://localhost:5000/api/fnb/categories/${categoryID}`, editingCategory, { headers: { Authorization: `Bearer ${token}` } });
    setEditingCategory(null);
    loadData();
  };

  const deleteCategory = async (categoryID) => {
    if (!window.confirm("Delete this category?")) return;
    await axios.delete(`http://localhost:5000/api/fnb/categories/${categoryID}`, { headers: { Authorization: `Bearer ${token}` } });
    loadData();
  };

  // ----------------- Product CRUD -----------------
  const createProduct = async () => {
    if (!productForm.productName || !productForm.price || !productForm.categoryID) return alert("Fill all product fields");
    const payload = { ...productForm, categoryID: parseInt(productForm.categoryID), price: parseFloat(productForm.price), isAvailable: true };
    await axios.post("http://localhost:5000/api/fnb/products", payload, { headers: { Authorization: `Bearer ${token}` } });
    setProductForm({ categoryID: "", productName: "", price: "", size: "" });
    loadData();
  };

  const updateProduct = async (productID) => {
    await axios.put(`http://localhost:5000/api/fnb/products/${productID}`, editingProduct, { headers: { Authorization: `Bearer ${token}` } });
    setEditingProduct(null);
    loadData();
  };

  const deleteProduct = async (productID) => {
    if (!window.confirm("Delete this product?")) return;
    await axios.delete(`http://localhost:5000/api/fnb/products/${productID}`, { headers: { Authorization: `Bearer ${token}` } });
    loadData();
  };

  // ----------------- Package CRUD -----------------
  const createPackage = async () => {
    if (!packageForm.packageName || !packageForm.totalValue) return alert("Fill all package fields");
    await axios.post("http://localhost:5000/api/fnb/packages", { ...packageForm, totalValue: parseFloat(packageForm.totalValue) }, { headers: { Authorization: `Bearer ${token}` } });
    setPackageForm({ packageName: "", totalValue: "" });
    loadData();
  };

  const updatePackage = async (packageID) => {
    await axios.put(`http://localhost:5000/api/fnb/packages/${packageID}`, editingPackage, { headers: { Authorization: `Bearer ${token}` } });
    setEditingPackage(null);
    loadData();
  };

  const deletePackage = async (packageID) => {
    if (!window.confirm("Delete this package?")) return;
    await axios.delete(`http://localhost:5000/api/fnb/packages/${packageID}`, { headers: { Authorization: `Bearer ${token}` } });
    loadData();
  };

  // ----------------- Package Items -----------------
  const viewPackageItems = async (pkg) => {
    setSelectedPackage(pkg);
    const res = await axios.get(`http://localhost:5000/api/fnb/packages/${pkg.packageID}/items`, { headers: { Authorization: `Bearer ${token}` } });
    setPackageItems(res.data.data || []);
  };

  const addProductToPackage = async () => {
    if (!selectedPackage || !packageItemForm.productID || !packageItemForm.quantity) return alert("Select product and quantity");
    await axios.post(`http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items`, {
      productID: parseInt(packageItemForm.productID),
      quantity: parseInt(packageItemForm.quantity)
    }, { headers: { Authorization: `Bearer ${token}` } });
    setPackageItemForm({ productID: "", quantity: "" });
    viewPackageItems(selectedPackage);
  };

  const removeItemFromPackage = async (item) => {
    if (!window.confirm(`Remove ${item.productName} from ${selectedPackage.packageName}?`)) return;
    await axios.delete(`http://localhost:5000/api/fnb/packages/${selectedPackage.packageID}/items/${item.packageItemID}`, { headers: { Authorization: `Bearer ${token}` } });
    viewPackageItems(selectedPackage);
  };

  // ----------------- JSX -----------------
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">🍴 F&B Management</h1>

      {/* Categories */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl mb-3 font-semibold">Categories</h2>
        <div className="flex gap-2 mb-3">
          <input placeholder="Name" value={categoryForm.categoryName} onChange={e => setCategoryForm({ ...categoryForm, categoryName: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Description" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className="border p-2 rounded" />
          <button onClick={createCategory} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
        </div>
        <ul className="list-disc ml-6">
          {categories.map(c => (
            <li key={c.categoryID} className="flex items-center gap-2">
              {editingCategory?.categoryID === c.categoryID ? (
                <>
                  <input value={editingCategory.categoryName} onChange={e => setEditingCategory({ ...editingCategory, categoryName: e.target.value })} className="border p-1" />
                  <button onClick={() => updateCategory(c.categoryID)} className="text-green-600">Save</button>
                  <button onClick={() => setEditingCategory(null)} className="text-gray-500">Cancel</button>
                </>
              ) : (
                <>
                  {c.categoryName}
                  <button onClick={() => setEditingCategory(c)} className="text-blue-500">Edit</button>
                  <button onClick={() => deleteCategory(c.categoryID)} className="text-red-500">Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Products */}
      <section className="bg-white p-5 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          <select value={productForm.categoryID} onChange={e => setProductForm({ ...productForm, categoryID: e.target.value })} className="border p-2 rounded w-48">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>)}
          </select>
          <input placeholder="Product Name" value={productForm.productName} onChange={e => setProductForm({ ...productForm, productName: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Price" type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="border p-2 rounded w-24" />
          <select value={productForm.size} onChange={e => setProductForm({ ...productForm, size: e.target.value })} className="border p-2 rounded w-24">
            <option value="">Size</option>
            <option value="8oz">8oz</option>
            <option value="12oz">12oz</option>
            <option value="16oz">16oz</option>
          </select>
          <button onClick={createProduct} className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
        </div>
        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Size</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.productID}>
                {editingProduct?.productID === p.productID ? (
                  <>
                    <td><input value={editingProduct.productName} onChange={e => setEditingProduct({ ...editingProduct, productName: e.target.value })} className="border p-1" /></td>
                    <td>{p.categoryName}</td>
                    <td>
                      <select value={editingProduct.size} onChange={e => setEditingProduct({ ...editingProduct, size: e.target.value })} className="border p-1 w-24">
                        <option value="">Select Size</option>
                        <option value="8oz">8oz</option>
                        <option value="12oz">12oz</option>
                        <option value="16oz">16oz</option>
                      </select>
                    </td>
                    <td><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="border p-1 w-20" /></td>
                    <td>
                      <button onClick={() => updateProduct(p.productID)} className="text-green-600">Save</button>
                      <button onClick={() => setEditingProduct(null)} className="text-gray-500">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{p.productName}</td>
                    <td>{p.categoryName}</td>
                    <td>{p.size || "-"}</td>
                    <td>₱{p.price}</td>
                    <td>
                      <button onClick={() => setEditingProduct(p)} className="text-blue-500 mr-2">Edit</button>
                      <button onClick={() => deleteProduct(p.productID)} className="text-red-500">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Packages & Package Items */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Packages</h2>
        <div className="flex gap-2 mb-3">
          <input placeholder="Package Name" value={packageForm.packageName} onChange={e => setPackageForm({ ...packageForm, packageName: e.target.value })} className="border p-2 rounded" />
          <input placeholder="Total Value" type="number" value={packageForm.totalValue} onChange={e => setPackageForm({ ...packageForm, totalValue: e.target.value })} className="border p-2 rounded w-32" />
          <button onClick={createPackage} className="bg-purple-600 text-white px-4 py-2 rounded">Add</button>
        </div>

        {packages.map(pkg => (
          <div key={pkg.packageID} className="border rounded p-3 mb-3 hover:bg-gray-50">
            {editingPackage?.packageID === pkg.packageID ? (
              <div className="flex gap-2">
                <input value={editingPackage.packageName} onChange={e => setEditingPackage({ ...editingPackage, packageName: e.target.value })} className="border p-1" />
                <input type="number" value={editingPackage.totalValue} onChange={e => setEditingPackage({ ...editingPackage, totalValue: e.target.value })} className="border p-1 w-24" />
                <button onClick={() => updatePackage(pkg.packageID)} className="text-green-600">Save</button>
                <button onClick={() => setEditingPackage(null)} className="text-gray-500">Cancel</button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{pkg.packageName} - ₱{pkg.totalValue}</h3>
                <div>
                  <button onClick={() => setEditingPackage(pkg)} className="text-blue-500 mr-2">Edit</button>
                  <button onClick={() => deletePackage(pkg.packageID)} className="text-red-500">Delete</button>
                </div>
              </div>
            )}

            {/* Package Items */}
            <div className="mt-3">
              <button onClick={() => viewPackageItems(pkg)} className="text-indigo-600 underline mb-2">View Items</button>
              {selectedPackage?.packageID === pkg.packageID && (
                <>
                  <div className="flex gap-2 mb-2">
                    <select value={packageItemForm.productID} onChange={e => setPackageItemForm({ ...packageItemForm, productID: e.target.value })} className="border p-1 rounded w-48">
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
                    </select>
                    <input type="number" value={packageItemForm.quantity} onChange={e => setPackageItemForm({ ...packageItemForm, quantity: e.target.value })} className="border p-1 w-24" />
                    <button onClick={addProductToPackage} className="bg-indigo-600 text-white px-2 rounded">Add</button>
                  </div>

                  <table className="w-full text-sm border rounded">
                    <thead className="bg-gray-100">
                      <tr><th>Product</th><th>Qty</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {packageItems.length > 0 ? packageItems.map(item => (
                        <tr key={item.packageItemID}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>
                            <button onClick={() => removeItemFromPackage(item)} className="text-red-500">Remove</button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" className="text-center p-2 text-gray-400">No items yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}