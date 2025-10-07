// controllers/chapel_info_controller.js
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
    const { chapelName, description } = req.body;
    await Model.createChapel(chapelName, description);
    return success(res, null, "Chapel created");
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
