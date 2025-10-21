// controllers/tables_controller.js
import * as Model from "../models/tables_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------SIZES-------------------------
export const getSizes = async (req, res) => {
  try {
    const data = await Model.getAllSizes();
    return success(res, data, "Sizes fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const createSize = async (req, res) => {
  try {
    const { size } = req.body;
    if (!size) return error(res, "Size is required", 400);
    const data = await Model.addSize(size);
    return success(res, data, "Size added successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const updateSize = async (req, res) => {
  try {
    const { sizeId } = req.params;
    const { size } = req.body;
    if (!size) return error(res, "Size is required", 400);
    const updated = await Model.updateSize(parseInt(sizeId), size);
    if (!updated) return error(res, "Size not found or not updated", 404);
    return success(res, null, "Size updated successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const deleteSize = async (req, res) => {
  try {
    const { sizeId } = req.params;
    const deleted = await Model.deleteSize(parseInt(sizeId));
    if (!deleted) return error(res, "Size not found", 404);
    return success(res, null, "Size deleted successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// ----------------------ROLES-------------------------
export const getRoles = async (req, res) => {
  try {
    const data = await Model.getAllRoles();
    return success(res, data, "Roles fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const createRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return error(res, "Role is required", 400);
    const data = await Model.addRole(role);
    return success(res, data, "Role added successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { role } = req.body;
    if (!role) return error(res, "Role is required", 400);
    const updated = await Model.updateRole(parseInt(roleId), role);
    if (!updated) return error(res, "Role not found or not updated", 404);
    return success(res, null, "Role updated successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const deleted = await Model.deleteRole(parseInt(roleId));
    if (!deleted) return error(res, "Role not found", 404);
    return success(res, null, "Role deleted successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// ----------------------STATUS-------------------------
export const getStatus = async (req, res) => {
  try {
    const data = await Model.getAllStatus();
    return success(res, data, "Status list fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const createStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return error(res, "Status is required", 400);
    const data = await Model.addStatus(status);
    return success(res, data, "Status added successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { status } = req.body;
    if (!status) return error(res, "Status is required", 400);
    const updated = await Model.updateStatus(parseInt(statusId), status);
    if (!updated) return error(res, "Status not found or not updated", 404);
    return success(res, null, "Status updated successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const deleted = await Model.deleteStatus(parseInt(statusId));
    if (!deleted) return error(res, "Status not found", 404);
    return success(res, null, "Status deleted successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
