// controllers/staff_info_controller.js
import * as Model from "../models/staff_info_model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { success, error } from "../utils/response_helper.js";
import { generateRefreshToken } from "../utils/token.js";


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
    const { firstName, middleInitial, lastName, email, phone, roleId, password, statusId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !roleId || !statusId) {
      return error(res, "Missing required fields: firstName, lastName, email, password, roleId, or statusId", 400);
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Generate refresh token
    const refreshToken = generateRefreshToken();

    // Insert into DB
    const staff = await Model.createStaff({
      firstName,
      middleInitial: middleInitial || null,
      lastName,
      email,
      phone: phone || null,
      roleId,
      statusId,
      passwordHash: hash,
      refreshToken       
    });

    // Success response
    return success(res, {
      staffID: staff.staffID,
      firstName: staff.firstName,
      middleInitial: staff.middleInitial,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      roleId: staff.roleId,
      statusId: staff.statusId,
      refreshToken: staff.refreshToken  
    }, "Staff created successfully.");

  } catch (e) {
    console.error("Error registering staff:", e);
    return error(res, e.message);
  }
};

// ----------------------POST LOGIN-------------------------
// export const staffLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const staff = await Model.getStaffByEmail(email);
//     if (!staff) return error(res, "Invalid credentials", 400);

//     const ok = await bcrypt.compare(password, staff.passwordHash);
//     if (!ok) return error(res, "Invalid credentials", 400);

//     const token = jwt.sign(
//       {
//         staffID: staff.staffID,
//         email: staff.email,
//         roleId: staff.roleId,
//         statusId: staff.statusId
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "12h" }
//     );

//     const { passwordHash, ...staffData } = staff;
//     return success(res, { token, staff: staffData }, "Login Successful");
//   } catch (e) {
//     return error(res, e.message);
//   }
// }; // old code

export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await Model.getStaffByEmail(email);

    if (!staff) return error(res, "Invalid credentials", 400);

    // 🔒 Block inactive accounts
    if (staff.statusId === 2) {
      return error(res, "Account is inactive. Please contact administrator.", 403);
    }

    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) return error(res, "Invalid credentials", 400);

    const accessToken = jwt.sign(
      {
        staffID: staff.staffID,
        email: staff.email,
        roleId: staff.roleId,
        statusId: staff.statusId
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { staffID: staff.staffID },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await Model.updateStaffToken(staff.staffID, accessToken, refreshToken);

    const { passwordHash, ...staffData } = staff;

    return success(res, { accessToken, staff: staffData }, "Login Successful");

  } catch (e) {
    return error(res, e.message);
  }
};


export const staffLogout = async (req, res) => {
    try {
        const { staffID } = req.body;
        if (!staffID) return res.status(400).json({ message: "staffID is required" });

        await Model.updateStaffToken(staffID, null, null);
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Internal server error", error: e.message });
    }
};

// ----------------------PUT-------------------------
// Update staff
export const updateStaff = async (req, res) => {
  try {
    const { staffID } = req.params;
    const updateData = req.body;

    if (!staffID) return res.status(400).json({ success: false, message: "Staff ID required" });
    if (!updateData || Object.keys(updateData).length === 0)
      return res.status(400).json({ success: false, message: "No fields provided to update" });

    const updated = await Model.updateStaff({ staffID: parseInt(staffID), ...updateData });

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

export const refreshStaffToken = async (req, res) => {
  try {
    const { staffID } = req.body || {};
    if (!staffID) return res.status(400).json({ message: "staffID is required" });

    const staffInfo = await Model.getStaffByID(staffID);
    console.log("staffInfo: ", staffInfo)
    if (!staffInfo) {
      return res.status(404).json({ message: "Staff not found" });
    }

    try {
      jwt.verify(staffInfo.refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(403).json({ message: "Expired refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        staffID: staffInfo.staffID,
        email: staffInfo.email,
        roleId: staffInfo.roleId,
        statusId: staffInfo.statusId
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const updatedStaff = await Model.updateStaffToken(
      staffInfo.staffID,
      newAccessToken,
      staffInfo.refreshToken
    );

    if (!updatedStaff) return res.status(404).json({ message: "Staff not found" });

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: {
        staffID: updatedStaff.staffID,
        firstName: updatedStaff.firstName,
        middleInitial: updatedStaff.middleInitial,
        lastName: updatedStaff.lastName,
        email: updatedStaff.email,
        phone: updatedStaff.phone,
        role: updatedStaff.role,
        status: updatedStaff.status,
        accessToken: newAccessToken
      }
    });
  } catch (e) {
    console.error("Error refreshing staff token:", e);
    return res.status(500).json({ message: "Internal server error", error: e.message });
  }
};
