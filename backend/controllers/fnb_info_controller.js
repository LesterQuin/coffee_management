import * as Model from "../models/fnb_info_model.js";
import { success, error } from "../utils/response_helper.js";

// -------------------- Categories --------------------
export const listCategories = async (req, res) => {
  try {
    const data = await Model.getAllCategories();
    return success(res, data, "Categories fetched successfully");
  } catch (e) {
    console.error("❌ listCategories error:", e);
    return error(res, e.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    await Model.createCategory(req.body);
    return success(res, null, "Category created successfully");
  } catch (e) {
    console.error("❌ createCategory error:", e);
    return error(res, e.message);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;
    await Model.updateCategory(categoryID, req.body);
    return success(res, null, "Category updated successfully");
  } catch (e) {
    console.error("❌ updateCategory error:", e);
    return error(res, e.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;
    await Model.deleteCategory(categoryID);
    return success(res, null, "Category deleted successfully");
  } catch (e) {
    console.error("❌ deleteCategory error:", e);
    return error(res, e.message);
  }
};

// -------------------- Products --------------------
export const listProducts = async (req, res) => {
  try {
    const data = await Model.getAllProducts();
    return success(res, data, "Products fetched successfully");
  } catch (e) {
    console.error("❌ listProducts error:", e);
    return error(res, e.message);
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = req.body;

    if (req.file) {
      product.image = `uploads/products/${req.file.filename}`;
    }
    
    await Model.createProduct(req.body);
    return success(res, null, "Product created successfully");
  } catch (e) {
    console.error("❌ createProduct error:", e);
    return error(res, e.message);
  }
};

export const updateProduct = async (req, res) => {
  const { productID } = req.params;
  try {
    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.image = `uploads/products/${req.file.filename}`;
    }

    const updated = await Model.updateProduct(productID, updatedData);
    if (!updated) {
      return error(res, "Product not found or no fields to update", 404);
    }

    return success(res, null, "Product updated successfully");
  } catch (e) {
    console.error("❌ updateProduct error:", e);
    return error(res, e.message);
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { productID } = req.params;
    await Model.deleteProduct(productID);
    return success(res, null, "Product deleted successfully");
  } catch (e) {
    console.error("❌ deleteProduct error:", e);
    return error(res, e.message);
  }
};

// -------------------- Packages --------------------
export const listPackages = async (req, res) => {
  try {
    const data = await Model.getAllPackages();
    return success(res, data, "Packages fetched successfully");
  } catch (e) {
    console.error("❌ listPackages error:", e);
    return error(res, e.message);
  }
};

export const createPackage = async (req, res) => {
  try {
    const { packageName, description, totalValue, quantity } = req.body;

    if (!packageName || !totalValue || quantity === undefined) {
      return res.status(400).json({ error: "packageName, totalValue, and quantity are required" });
    }

    // Get the new package ID from the model
    const packageID = await Model.createPackage({ packageName, description, totalValue, quantity });

    res.status(201).json({ 
      message: "Package created successfully", 
      packageID 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const updatePackage = async (req, res) => {
  try {
    const { packageName, description, totalValue, quantity } = req.body;
    const { packageID } = req.params;

    if (!packageName || !totalValue || quantity === undefined) {
      return res.status(400).json({ error: "packageName, totalValue, and quantity are required" });
    }

    await Model.updatePackage(packageID, { packageName, description, totalValue, quantity });
    res.status(200).json({ message: "Package updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { packageID } = req.params;

    const { items } = await Model.getPackageItems(packageID);
    if (items.length > 0) {
      return error(res, "Cannot delete package: it has items attached", 400);
    }

    await Model.deletePackage(packageID);
    return success(res, null, "Package deleted successfully");
  } catch (e) {
    console.error("❌ deletePackage error:", e);
    return error(res, e.message);
  }
};

// -------------------- Package Items --------------------
// export const listPackageItems = async (req, res) => {
//   try {
//     const { packageID } = req.params;
//     if (!packageID) return error(res, "packageID is required", 400);

//     const items = await Model.getPackageItems(packageID);
//     return success(res, items, "Package items fetched successfully");
//   } catch (e) {
//     console.error("❌ listPackageItems error:", e);
//     return error(res, e.message);
//   }
// };
export const listPackageItems = async (req, res) => {
  try {
    const { packageID } = req.params;
    if (!packageID) return error(res, "packageID is required", 400);

    const result = await Model.getPackageItems(packageID);

    if (!result.success) {
      return error(res, result.message || "No items found for this package", 404);
    }

    return success(res, result.data, result.message);
  } catch (e) {
    console.error("❌ listPackageItems error:", e);
    return error(res, e.message);
  }
};

export const addPackageItem = async (req, res) => {
  try {
    const { packageID } = req.params;
    const { productIDs } = req.body;

    if (!packageID || !Array.isArray(productIDs) || productIDs.length === 0) {
      return error(res, "packageID and productIDs array are required", 400);
    }

    const addedItems = [];
    for (const productID of productIDs) {
      const result = await Model.addPackageItem(packageID, productID);
      addedItems.push(result);
    }

    return success(res, addedItems, "Products added to package successfully");
  } catch (e) {
    console.error("❌ addPackageItem error:", e);
    return error(res, e.message || "Failed to add package items");
  }
};

export const updatePackageItem = async (req, res) => {
  try {
    const { packageID, itemId } = req.params;
    const { quantity } = req.body;

    if (!packageID || !itemId || quantity === undefined || Number(quantity) < 0) {
      return error(res, "packageID, itemId and non-negative quantity are required", 400);
    }

    const result = await Model.updatePackageItemQuantity(packageID, itemId, Number(quantity));

    return success(res, result, "Package item quantity updated successfully");
  } catch (e) {
    console.error("❌ updatePackageItem error:", e);
    return error(res, e.message || "Internal server error");
  }
};

export const deletePackageItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) return error(res, "itemId is required", 400);

    const item = await Model.getPackageItemById(itemId);
    if (!item) return error(res, "Package item not found", 404);

    await Model.deletePackageItem(itemId);

    return success(res, null, "Package item deleted successfully");
  } catch (e) {
    console.error("❌ deletePackageItem error:", e);
    return error(res, e.message || "Failed to delete package item");
  }
};

// -------------------- Products by Category --------------------
export const listProductByCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;

    if (!categoryID) {
      return error (res, "Category ID is required", 400);
    }
    const data = await Model.getProductByCategory(categoryID);

    if (data.length === 0) {
      return success(res, [], "No products found for this category");
    }

    return success(res, data, "Products fetched successfully by category");
  } catch (e) {
    console.error("❌ listProdcutsByCategory error:", e);
    return error(res, e.message);
  }
}

export const consumePackageItemController = async (req, res) => {
  try {
    const { packageID, productID, quantity } = req.body;

    if (!packageID || !productID || !quantity || Number(quantity) <= 0) {
      return error(res, "packageID, productID and positive quantity are required", 400);
    }

    const result = await Model.consumePackageItem(packageID, productID, Number(quantity));

    return success(res, result, "Package item consumed successfully");
  } catch (err) {
    console.error("❌ consumePackageItem error:", err);
    return error(res, err.message || "Failed to consume package item");
  }
};
