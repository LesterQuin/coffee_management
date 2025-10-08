// controllers/packages_info_controller.js
import * as Model from "../models/packages_info_model.js";
import { success, error } from "../utils/response_helper.js";

// create a new package
export const createPackage = async (req, res) => {
  try {
    const pkg = req.body;
    await Model.createPackage(pkg);
    return success(res, null, "Package created");
  } catch (e) {
    return error(res, e.message);
  }
};
// add item to package
export const addPackageItem = async (req, res) => {
  try {
    const { packageID, productID, quantity } = req.body;
    await Model.addPackageItem(packageID, productID, quantity);
    return success(res, null, "Package item added");
  } catch (e) {
    return error(res, e.message);
  }
};
