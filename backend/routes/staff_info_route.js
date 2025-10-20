import express from "express";
import * as Controller from "../controllers/staff_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// GET /api/staff
router.get("/", staffAuth, Controller.getAllStaff);

// POST /api/staff/register
router.post("/register", staffAuth, Controller.staffRegister);

// POST /api/staff/login
router.post("/login", Controller.staffLogin);

// GET /api/staff/:staffID
router.get("/:staffID", staffAuth, Controller.getStaffByID);

// DELETE /api/staff/:staffID
router.delete("/:staffID", staffAuth, Controller.deleteStaff);

// Update staff information (role-based validation)
router.put("/update", staffAuth, Controller.updateStaff);

export default router;
