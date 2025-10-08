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
// Add item to package
export const addPackageItem = async (req, res) => {
  try {
    const { packageID, productID, quantity } = req.body;
    await Model.addPackageItem(packageID, productID, quantity);
    return success(res, null, "Package item added");
  } catch (e) {
    return error(res, e.message);
  }
};
