// controllers/staff_info_controller.js
import * as Model from "../models/staff_info_model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { success, error } from "../utils/response_helper.js";
dotenv.config();

// Get all staff members
export const getAllStaff = async (req, res) => {
  try {
    const staffList = await Model.getAllStaff();
    res.json({ success: true, data: staffList });
  } catch (err) {
    console.error(" Error fetching staff:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Staff registration
export const staffRegister = async (req, res) => {
  try {
    const { fullName, email, phone, role, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await Model.createStaff({ fullName, email, phone, role, passwordHash: hash });
    return success(res, null, "Staff created");
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
    const token = jwt.sign({ staffID: staff.staffID, email: staff.email, role: staff.role }, process.env.JWT_SECRET, { expiresIn: "12h" });
    return success(res, { token }, "Login successful");
  } catch (e) {
    return error(res, e.message);
  }
};
