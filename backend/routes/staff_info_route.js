// routes/staff_info_route.js
import express from "express";
import { staffRegister, staffLogin,  } from "../controllers/staff_info_controller.js";
import * as Controller from "../controllers/staff_info_controller.js";
import { staffAuth } from "../middleware/auth_middleware.js";

const router = express.Router();

// GET /api/staff
router.get("/", staffAuth, Controller.getAllStaff);

// POST /api/staff/register
router.post("/register", staffAuth, staffRegister);

// POST /api/staff/login
router.post("/login",  staffLogin);

// GET /api/staff/id
router.get("/:staffID", staffAuth, Controller.getStaffByID);

// DELETE api/staff/:id
router.delete("/:staffID", staffAuth,  Controller.deleteStaff);

export default router;
