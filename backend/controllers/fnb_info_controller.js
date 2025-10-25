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

// export const createPackage = async (req, res) => {
//   try {
//     await Model.createPackage(req.body);
//     return success(res, null, "Package created successfully");
//   } catch (e) {
//     console.error("❌ createPackage error:", e);
//     return error(res, e.message);
//   }
// };
export const createPackage = async (req, res) => {
  try {
    const payload = req.body;
    // validate required fields if needed
    const created = await Model.createPackage(payload);
    return success(res, { packageID: created.packageID, totalValue: Number(created.totalValue) }, "Package created successfully");
  } catch (e) {
    console.error("❌ createPackage error:", e);
    return error(res, e.message);
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { packageID } = req.params;
    await Model.updatePackage(packageID, req.body);
    return success(res, null, "Package updated successfully");
  } catch (e) {
    console.error("❌ updatePackage error:", e);
    return error(res, e.message);
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
export const listPackageItems = async (req, res) => {
  try {
    const { packageID } = req.params;
    if (!packageID) return error(res, "packageID is required", 400);

    const { items, remainingValue, exceeded, exceededValue } = await Model.getPackageItems(packageID);
    return success(res, { items, remainingValue, exceeded, exceededValue }, "Package items fetched successfully");
  } catch (e) {
    console.error("❌ listPackageItems error:", e);
    return error(res, e.message);
  }
};

// export const addPackageItem = async (req, res) => {
//   try {
//     const { packageID } = req.params;
//     const { productID, quantity } = req.body;

//     if (!packageID || !productID || !quantity) {
//       return error(res, "packageID, productID and quantity are required", 400);
//     }

//     await Model.addPackageItem(Number(packageID), Number(productID), Number(quantity));

//     // return updated package items + remaining/exceeded info
//     const result = await Model.getPackageItems(Number(packageID));
//     return success(res, result, "Package item added successfully");
//   } catch (e) {
//     console.error("❌ addPackageItem error:", e);
//     return error(res, e.message || "Failed to add package item");
//   }
// };

// this is ID with endpoint 
// export const addPackageItems = async (req, res) => {
//   try {
//     const { packageID } = req.params;
//     const { items } = req.body; // array of { productID, quantity }

//     if (!packageID || !items || !Array.isArray(items) || items.length === 0) {
//       return error(res, "packageID and items array are required", 400);
//     }

//     await Model.addPackageItems(Number(packageID), items);

//     // return updated package items + remaining/exceeded info
//     const result = await Model.getPackageItems(Number(packageID));
//     return success(res, result, "Package items added successfully");
//   } catch (e) {
//     console.error("❌ addPackageItems error:", e);
//     return error(res, e.message || "Failed to add package items");
//   }
// };

export const addPackageItems = async (req, res) => {
  try {
    const { packageID, items } = req.body; // packageID is now in the body

    if (!packageID || !items || !Array.isArray(items) || items.length === 0) {
      return error(res, "packageID and items array are required", 400);
    }

    await Model.addPackageItems(Number(packageID), items);

    // Return updated package items + remaining/exceeded info
    const result = await Model.getPackageItems(Number(packageID));
    return success(res, result, "Package items added successfully");
  } catch (e) {
    console.error("❌ addPackageItems error:", e);
    return error(res, e.message || "Failed to add package items");
  }
};


export const updatePackageItem = async (req, res) => {
  try {
    const { packageID, itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return error(res, "Invalid quantity value", 400);
    }

    const updated = await Model.updatePackageItem(Number(packageID), Number(itemId), Number(quantity));

    if (!updated) return error(res, "Package item not found or not updated", 404);

    const result = await Model.getPackageItems(Number(packageID));
    return success(res, result, "Item quantity updated successfully");
  } catch (e) {
    console.error("❌ updatePackageItem error:", e);
    return error(res, e.message || "Internal server error");
  }
};

export const deletePackageItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // fetch item's packageID before deleting (model.deletePackageItem returns true/false)
    // but we need the packageID to return updated package items.
    const item = await Model.getPackageItemById(Number(itemId));
    if (!item) return error(res, "Package item not found", 404);

    await Model.deletePackageItem(Number(itemId));

    const result = await Model.getPackageItems(Number(item.packageID));
    return success(res, result, "Package item deleted successfully");
  } catch (e) {
    console.error("❌ deletePackageItem error:", e);
    return error(res, e.message);
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