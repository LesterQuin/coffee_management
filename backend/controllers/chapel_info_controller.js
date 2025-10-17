// controllers/chapel_info_controller.js
import { poolPromise } from "../config/db_config.js";
import * as Model from "../models/chapel_info_model.js";
import { success, error } from "../utils/response_helper.js";


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
// Create a new chapel room
export const create = async (req, res) => {
  try {
    const { chapelName, description, status } = req.body;

    if (!chapelName || !status){
      return error(res, "Both ChapelName and Status is required", 400);
    }
    const chapelStatus = status || "available";

    await Model.createChapel(chapelName, description, chapelStatus);
    return success(res, null, "Chapel created successfully");
  } catch (e) {
    return error(res, e.message);
  }
};
// Set the status of a chapel room
export const setStatus = async (req, res) => {
  try {
    const { chapelID, status } = req.body;
    await Model.setChapelStatus(chapelID, status);
    return success(res, null, "Chapel status updated");
  } catch (e) {
    return error(res, e.message);
  }
};
// update chapel details
export const updateChapel = async(req, res) => {
  const { chapelID } = req.params;
  const { chapelName, description, status } = req.body;

  console.log("Updating chapel ID:", chapelID);
  console.log("Payload:", { chapelName, description, status });

  try {
    const updated = await Model.updateChapel(chapelID, chapelName, description, status);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Chapel not found or no fields to update" });
    }
    return res.json({ success: true, message: "Chapel updated successfully" });
  } catch (e) {
    console.error("Update chapel DB error:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};
// delete
export const deleteChapel = async (req, res) => {
  const { chapelID } = req.params;
  try {
    const result = await Model.deleteChapel(chapelID);
    if (!result) return res.status(404).json({ success: false, message: "Chapel not found" });
    res.json({ success: true, message: "Chapel deleted successfully" });
  } catch (err) {
    console.error("Delete chapel error:", err);
    res.status(500).json({ success: false, message: "Server error" });
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