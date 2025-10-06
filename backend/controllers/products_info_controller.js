// controllers/products_info_controller.js
import * as Model from "../models/products_info_model.js";
import { success, error } from "../utils/response_helper.js";

export const listCategories = async (req, res) => {
  try {
    const rows = await Model.getCategories();
    return success(res, rows, "Categories fetched");
  } catch (e) {
    return error(res, e.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { categoryName, description, image } = req.body;
    await Model.createCategory(categoryName, description, image);
    return success(res, null, "Category created");
  } catch (e) {
    return error(res, e.message);
  }
};

export const createProduct = async (req, res) => {
  try {
    await Model.createProduct(req.body);
    return success(res, null, "Product created");
  } catch (e) {
    return error(res, e.message);
  }
};

export const listProducts = async (req, res) => {
  try {
    const rows = await Model.getProducts();
    return success(res, rows, "Products fetched");
  } catch (e) {
    return error(res, e.message);
  }
};
