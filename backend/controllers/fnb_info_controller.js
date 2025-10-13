import * as Model from "../models/fnb_info_model.js";
import { success, error } from "../utils/response_helper.js";

// Categories
export const listCategories = async (req, res) => {
  try {
    const data = await Model.getAllCategories();
    return success(res, data, "Categories fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Create a new category
export const createCategory = async (req, res) => {
  try {
    await Model.createCategory(req.body);
    return success(res, null, "Category created");
  } catch (e) {
    return error(res, e.message);
  }
};
// Update a category
export const updateCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;
    await Model.updateCategory(categoryID, req.body);
    return success (res, null, "Category updated succesfully");
  } catch (e){
    return error(res, e.message);
  }
};
// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryID } = req.params;
    await Model.deleteCategory(categoryID);
    return success(res, null, "Category deleted successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// Products
export const listProducts = async (req, res) => {
  try {
    const data = await Model.getAllProducts();
    return success(res, data, "Products fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Create a new product
export const createProduct = async (req, res) => {
  try {
    const product = req.body;
    await Model.createProduct(product);
    return success(res, null, "Product created");
  } catch (e) {
    return error(res, e.message);
  }
};
// Update a product
export const updateProduct = async (req, res) => {
  try{
    const { productID } = req.params;
    await Model.updateProduct(productID, req.body);
    return success(res, null, "Product updated successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Delete a product
export const deleteProduct = async (req, res) => {
  try{
    const { productID } = req.params;
    await Model.deleteProduct(productID);
    return success(res, null, "Product deleted succesfully");
  } catch (e){
    return error(res, e.message);
  }
};

// Packages
export const listPackages = async (req, res) => {
  try {
    const data = await Model.getAllPackages();
    return success(res, data, "Packages fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Create a new package
export const createPackage = async (req, res) => {
  try {
    await Model.createPackage(req.body);
    return success(res, null, "Package created");
  } catch (e) {
    return error(res, e.message);
  }
};
// Update a package
export const updatePackage = async (req, res) => {
  try {
    const { packageID } = req.params;
    await Model.updatePackage(packageID, req.body);
    return success(res, null, "Package updated succesfully");
  }catch (e) {
    return error(res, e.message);
  }
};
// Delete a package
export const deletePackage = async (req, res) => {
  try {
    const { packageID } = req.params;
    await Model.deletePackage(packageID);
    return success(res, null, "Package deleted succesfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// List items in a package
export const listPackageItems = async (req, res) => {
  try {
    const { packageID } = req.params;
    console.log("📦 Fetching items for packageID:", packageID);
    const data = await Model.getPackageItems(packageID);
    return success(res, data, "Package items fetched successfully");
  } catch (e) {
    console.error("❌ Error in listPackageItems:", e);
    return error(res, e.message);
  }
};

// Add item to a package
export const addPackageItem = async (req, res) => {
  try {
    const { packageID } = req.params;
    const { productID, quantity } = req.body;
    await Model.addPackageItem(packageID, productID, quantity);
    return success(res, null, "Package item added");
  } catch (e) {
    return error(res, e.message);
  }
};

// Delete item from a package
export const deletePackageItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await Model.deletePackageItem(itemId);
    return success(res, null, "Package item deleted successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
