// controllers/staff_info_controller.js
import * as Model from "../models/staff_info_model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { success, error } from "../utils/response_helper.js";

dotenv.config();

// ----------------------GET-------------------------
// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    const staffList = await Model.getAllStaff();
    res.json({ success: true, data: staffList });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get staff by ID
export const getStaffByID = async (req, res) => {
  const { staffID } = req.params;
  try {
    const staff = await Model.getStaffByID(staffID);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    return res.json({ success: true, data: staff });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------POST-------------------------
// Staff registration
export const staffRegister = async (req, res) => {
  try {
    const { firstName, middleInitial, lastName, email, phone, roleId, password } = req.body;

    if (!firstName || !lastName || !email || !password || !roleId) {
      return error(res, "Missing required fields: firstName, lastName, email, password, or roleId", 400);
    }

    const hash = await bcrypt.hash(password, 10);
    await Model.createStaff({ firstName, middleInitial, lastName, email, phone, roleId, statusId, passwordHash: hash });

    return success(res, null, "Staff created successfully.");
  } catch (e) {
    return error(res, e.message);
  }
};

// Staff login
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await Model.getStaffByEmail(email);
    if (!staff) return error(res, "Invalid credentials", 400);
    
    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) return error(res, "Invalid credentials", 400);
    
    const token = jwt.sign(
      {
        staffID: staff.staffID,
        email: staff.email,
        role: staff.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    const { passwordHash, ...staffData } = staff;
    return success(res, { token, staff: staffData }, "Login Successful");
  } catch (e) {
    return error(res, e.message);
  }
};

// ----------------------PUT-------------------------
// Update staff (role-based validation)
export const updateStaff = async (req, res) => {
  try {
    const { staffID } = req.params;
    const { roleId, ...fieldsToUpdate } = req.body;

    if (Object.keys(fieldsToUpdate).length === 0 && !roleId)
      return res.status(400).json({ success: false, message: "No fields provided to update" });

    const currentUserRole = req.user.role;

    // If roleId is provided, fetch the role name
    if (roleId !== undefined) {
      const pool = await poolPromise;
      const roleRes = await pool.request()
        .input("roleId", sql.Int, roleId)
        .query("SELECT role FROM sg.LQ_CSS_roles WHERE roledId = @roleId");

      if (!roleRes.recordset[0])
        return res.status(400).json({ success: false, message: `Invalid roleId: ${roleId}` });

      fieldsToUpdate.role = roleRes.recordset[0].role;
    }

    const updated = await Model.updateStaff({ staffID: parseInt(staffID), ...fieldsToUpdate }, currentUserRole);

    if (!updated)
      return res.status(404).json({ success: false, message: "Staff not found or no changes applied" });

    return res.json({ success: true, message: "Staff updated successfully" });
  } catch (err) {
    console.error("Update staff error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------DELETE-------------------------
// Delete staff by ID
export const deleteStaff = async (req, res) => {
  try {
    const { staffID } = req.params;
    if (!staffID) return res.status(400).json({ success: false, message: "Staff ID required" });

    const deleted = await Model.deleteStaffModel(staffID);
    if (!deleted) return res.status(404).json({ success: false, message: "Staff not found" });

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (err) {
    console.error("Delete staff error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
