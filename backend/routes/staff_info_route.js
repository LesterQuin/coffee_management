import express from "express";
import * as Controller from "../controllers/staff_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// ----------------------GET-------------------------
// GET /api/staff
router.get("/", staffAuth, Controller.getAllStaff);
// GET /api/staff/:staffID
router.get("/:staffID", staffAuth, Controller.getStaffByID);

// ----------------------POST-------------------------
// POST /api/staff/register
router.post("/register", Controller.staffRegister);
// POST /api/staff/login
router.post("/login", Controller.staffLogin);

// ----------------------PUT-------------------------
// Update staff information (role-based validation)
router.put("/:staffID", staffAuth, Controller.updateStaff);

// ----------------------DELETE-------------------------
// DELETE /api/staff/:staffID
router.delete("/:staffID", staffAuth, Controller.deleteStaff);

export default router;
