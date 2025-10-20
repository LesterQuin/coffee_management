// controllers/tables_controller.js
import * as Model from "../models/tables_model.js";
import { success, error } from "../utils/response_helper.js";

// Get sizes
export const getSizes = async (req, res) => {
  try {
    const data = await Model.getAllSizes();
    return success(res, data, "Sizes fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// Get roles
export const getRoles = async (req, res) => {
  try {
    const data = await Model.getAllRoles();
    return success(res, data, "Roles fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// Get status
export const getStatus = async (req, res) => {
  try {
    const data = await Model.getAllStatus();
    return success(res, data, "Status list fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
