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
    const updated = await Model.updateProduct(productID, req.body);
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
    await Model.createPackage(req.body);
    return success(res, null, "Package created successfully");
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
    const { items, remainingValue } = await Model.getPackageItems(packageID);
    return success(res, { items, remainingValue }, "Package items fetched successfully");
  } catch (e) {
    console.error("❌ listPackageItems error:", e);
    return error(res, e.message);
  }
};

export const addPackageItem = async (req, res) => {
  try {
    const { packageID } = req.params;
    const { productID, quantity } = req.body;

    const allowed = await Model.canAddPackageItem(packageID, productID, quantity);
    if (!allowed) {
      return error(res, "Cannot add item: exceeds package total value", 400);
    }

    await Model.addPackageItem(packageID, productID, quantity);
    const { items, remainingValue } = await Model.getPackageItems(packageID);

    return success(res, { items, remainingValue }, "Package item added successfully");
  } catch (e) {
    console.error("❌ addPackageItem error:", e);
    return error(res, e.message || "Failed to add package item");
  }
};

export const deletePackageItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Model.getPackageItemById(itemId);

    if (!item) return error(res, "Package item not found", 404);

    await Model.deletePackageItem(itemId);

    const { items, remainingValue } = await Model.getPackageItems(item.packageID);

    return success(res, { items, remainingValue }, "Package item deleted successfully");
  } catch (e) {
    console.error("❌ deletePackageItem error:", e);
    return error(res, e.message);
  }
};
