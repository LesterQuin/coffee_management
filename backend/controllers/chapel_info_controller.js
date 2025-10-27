// controllers/chapel_info_controller.js
import { poolPromise } from "../config/db_config.js";
import * as Model from "../models/chapel_info_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// Get all chapels
export const getAllChapels = async (req, res) => {
  try {
    const data = await Model.getAllChapels();
    return success(res, data, "Chapel list fetched successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// Get all available chapels
export const listAvailable = async (req, res) => {
  try {
    const rows = await Model.getAvailableChapels();
    return success(res, rows, "Available chapels");
  } catch (e) {
    return error(res, e.message);
  }
};

// get id package by chapel
export const listPackagesByChapel = async (req, res) => {
  const chapelID = parseInt(req.params.chapelID);
  try{
    const packages = await PackageModel.getPackageByChapel(chapelID);
    res.json({ data: packages });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch packages "});
  }
};

// ----------------------POST-------------------------
// Create a new chapel room
export const create = async (req, res) => {
  try {
    const { chapelName, description, packageID, statusId } = req.body;

    if (!chapelName){
      return error(res, "ChapelName is required", 400);
    }

    const chapel = await Model.createChapelWithPackage(chapelName, description, packageID, statusId);
    return success(res, chapel, "Chapel created successfully");
  } catch (e) {
    return error(res, e.message);
  }
};

// ----------------------PUT-------------------------
// update chapel details
export const updateChapel = async(req, res) => {
  const { chapelID } = req.params;
  const { chapelName, description, packageID, statusId } = req.body;

  try {
    const updated = await Model.updateChapel(chapelID, chapelName, description, statusId, packageID);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Chapel not found or no fields to update" });
    }
    return res.json({ success: true, message: "Chapel updated successfully" });
  } catch (e) {
    console.error("❌ Update chapel DB error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------DELETE-------------------------
// delete
export const deleteChapel = async (req, res) => {
  const { chapelID } = req.params;
  try {
    const result = await Model.deleteChapel(chapelID);
    if (!result) return res.status(404).json({ success: false, message: "Chapel not found" });
    res.json({ success: true, message: "Chapel deleted successfully" });
  } catch (err) {
    console.error("❌ Delete chapel error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
